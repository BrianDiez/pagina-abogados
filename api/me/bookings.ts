// GET /api/me/bookings — consultas del CLIENTE autenticado (match por email
// de Clerk: cubre reservas hechas como invitado antes de crear la cuenta).
// Nunca expone lawyer_notes.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/auth";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const session = await requireSession(req, res);
  if (!session) return;

  const rows = await sql`
    select a.id, a.lawyer_id, a.client_id, a.service_id, a.status, a.starts_at,
           a.ends_at, a.modality, a.client_notes, a.video_room_url, a.price,
           a.currency, a.payment_status,
           s.name as service_name, l.display_name as lawyer_name, l.slug as lawyer_slug,
           c.name as client_name, c.email as client_email
    from appointments a
    join clients c on c.id = a.client_id
    join services s on s.id = a.service_id
    join lawyers l on l.id = a.lawyer_id
    where c.email = (select email from users where id = ${session.userId})
       or c.user_id = ${session.userId}
    order by a.starts_at desc
  `;
  return res.status(200).json(rows);
}
