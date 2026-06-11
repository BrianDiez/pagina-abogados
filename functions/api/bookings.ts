// POST  /api/bookings — crea la reserva (público; gratis confirma directo)
// PATCH /api/bookings?id=&action=demo-pay — gateway demo hasta MercadoPago
import { getSql, json, error, type Handler } from "../../server/db";

interface BookingBody {
  lawyerId: string;
  serviceId: string;
  start: string;
  client: { name: string; email: string; phone: string; country: string };
  notes?: string;
}

export const onRequestPost: Handler = async ({ request, env }) => {
  const body = (await request.json()) as BookingBody;
  if (!body?.lawyerId || !body?.serviceId || !body?.start || !body?.client?.email) {
    return error("Datos incompletos", 400);
  }

  const sql = getSql(env);
  const services = await sql`
    select * from services
    where id = ${body.serviceId} and lawyer_id = ${body.lawyerId} and is_active
  `;
  if (services.length === 0) return error("Servicio no encontrado", 404);
  const service = services[0]!;
  const ends = new Date(new Date(body.start).getTime() + service.duration_minutes * 60_000);

  try {
    const clients = await sql`
      insert into clients (name, email, phone, country)
      values (${body.client.name}, ${body.client.email}, ${body.client.phone}, ${body.client.country})
      on conflict do nothing
      returning id
    `;
    const clientId =
      clients[0]?.id ??
      (await sql`select id from clients where email = ${body.client.email} limit 1`)[0]!.id;

    const appointments = await sql`
      insert into appointments
        (lawyer_id, client_id, service_id, starts_at, ends_at, modality,
         client_notes, price, currency, status)
      values
        (${body.lawyerId}, ${clientId}, ${body.serviceId}, ${body.start},
         ${ends.toISOString()}, ${service.modality}, ${body.notes ?? null},
         ${service.price}, ${service.currency},
         ${Number(service.price) === 0 ? "confirmed" : "pending_payment"})
      returning *
    `;
    return json(appointments[0], 201);
  } catch (e) {
    if (String(e).includes("no_overlapping_appointments")) {
      return error("Ese horario acaba de ser reservado. Elegí otro, por favor.", 409);
    }
    throw e;
  }
};

export const onRequestPatch: Handler = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  if (action !== "demo-pay" || !id) return error("Acción inválida", 400);

  const sql = getSql(env);
  const rows = await sql`
    update appointments
    set status = 'confirmed',
        payment_status = case when price = 0 then 'waived' else 'paid' end
    where id = ${id} and status in ('pending_payment', 'confirmed')
    returning *
  `;
  if (rows.length === 0) return error("Turno no encontrado", 404);
  await sql`
    insert into payments (appointment_id, lawyer_id, amount, currency, gateway, status)
    values (${id}, ${rows[0]!.lawyer_id}, ${rows[0]!.price}, ${rows[0]!.currency}, 'demo', 'completed')
  `;
  return json(rows[0]);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
