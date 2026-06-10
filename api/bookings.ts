// POST /api/bookings — crea la reserva en pending_payment (público: el cliente
// puede agendar sin cuenta). El constraint de exclusión de Postgres garantiza
// que dos requests simultáneos jamás reserven el mismo horario.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_lib/db";

interface BookingBody {
  lawyerId: string;
  serviceId: string;
  start: string; // ISO
  client: { name: string; email: string; phone: string; country: string };
  notes?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // PATCH ?id=&action=demo-pay — confirma con gateway 'demo' hasta integrar
  // MercadoPago (split de pagos). Se elimina cuando el checkout real esté vivo.
  if (req.method === "PATCH") {
    const { id, action } = req.query as Record<string, string>;
    if (action !== "demo-pay" || !id) return res.status(400).json({ error: "Acción inválida" });
    const rows = await sql`
      update appointments
      set status = 'confirmed',
          payment_status = case when price = 0 then 'waived' else 'paid' end
      where id = ${id} and status in ('pending_payment', 'confirmed')
      returning *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Turno no encontrado" });
    await sql`
      insert into payments (appointment_id, lawyer_id, amount, currency, gateway, status)
      values (${id}, ${rows[0]!.lawyer_id}, ${rows[0]!.price}, ${rows[0]!.currency}, 'demo', 'completed')
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const body = req.body as BookingBody;
  if (!body?.lawyerId || !body?.serviceId || !body?.start || !body?.client?.email) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const services = await sql`
    select * from services
    where id = ${body.serviceId} and lawyer_id = ${body.lawyerId} and is_active
  `;
  if (services.length === 0) return res.status(404).json({ error: "Servicio no encontrado" });
  const service = services[0]!;

  const ends = new Date(new Date(body.start).getTime() + service.duration_minutes * 60_000);

  try {
    // upsert del cliente por email
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
    return res.status(201).json(appointments[0]);
  } catch (e) {
    // 23P01 = exclusion_violation: el slot acaba de ser tomado por otro cliente
    if (String(e).includes("no_overlapping_appointments")) {
      return res
        .status(409)
        .json({ error: "Ese horario acaba de ser reservado. Elegí otro, por favor." });
    }
    throw e;
  }
}
