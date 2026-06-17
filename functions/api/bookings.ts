// GET   /api/bookings?id= — estado público de un turno (pantalla post-pago)
// POST  /api/bookings — crea la reserva (público; gratis confirma directo)
// PATCH /api/bookings?id=&action=demo-pay — gateway demo hasta MercadoPago
import { getSql, json, error, type Handler, type Env } from "../../server/db";
import { videoRoomUrl } from "../../server/video";

// Asigna sala de video a un turno confirmado de modalidad video (idempotente).
async function ensureVideoRoom(env: Env, appt: Record<string, unknown>): Promise<string | null> {
  if (appt.modality !== "video" || appt.video_room_url) {
    return (appt.video_room_url as string) ?? null;
  }
  const sql = getSql(env);
  const url = await videoRoomUrl(env, {
    id: String(appt.id),
    starts_at: String(appt.starts_at),
    ends_at: String(appt.ends_at),
  });
  await sql`update appointments set video_room_url = ${url} where id = ${appt.id}`;
  return url;
}

interface BookingBody {
  lawyerId: string;
  serviceId: string;
  start: string;
  client: { name: string; email: string; phone: string; country: string };
  notes?: string;
}

export const onRequestGet: Handler = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return error("id requerido", 400);
  const sql = getSql(env);
  // campos públicos mínimos para la confirmación (nunca lawyer_notes)
  const rows = await sql`
    select a.id, a.status, a.payment_status, a.starts_at, a.modality, a.price, a.currency,
           a.video_room_url, s.name as service_name, l.display_name as lawyer_name, l.slug as lawyer_slug
    from appointments a
    join services s on s.id = a.service_id
    join lawyers l on l.id = a.lawyer_id
    where a.id = ${id}
  `;
  if (rows.length === 0) return error("Turno no encontrado", 404);
  return json(rows[0]);
};

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
    const appt = appointments[0]!;
    // Consulta gratuita: ya queda confirmada → asignar sala de video
    if (appt.status === "confirmed") {
      appt.video_room_url = await ensureVideoRoom(env, appt);
    }
    return json(appt, 201);
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
  rows[0]!.video_room_url = await ensureVideoRoom(env, rows[0]!);
  return json(rows[0]);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
