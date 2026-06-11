// Agenda del profesional autenticado.
// GET  /api/me/appointments — turnos con datos de cliente y servicio
// PATCH /api/me/appointments — { id, status?, lawyerNotes?, cancelledBy? }
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/auth";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;
  if (!session.lawyerId) return res.status(403).json({ error: "No sos profesional" });

  if (req.method === "GET") {
    const rows = await sql`
      select a.*, c.name as client_name, c.email as client_email, s.name as service_name
      from appointments a
      join clients c on c.id = a.client_id
      join services s on s.id = a.service_id
      where a.lawyer_id = ${session.lawyerId}
      order by a.starts_at
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "PATCH") {
    const { id, status, lawyerNotes, cancelledBy } = req.body as {
      id: string;
      status?: string;
      lawyerNotes?: string;
      cancelledBy?: string;
    };
    if (!id) return res.status(400).json({ error: "id requerido" });
    const rows = await sql`
      update appointments set
        status = coalesce(${status ?? null}, status),
        lawyer_notes = coalesce(${lawyerNotes ?? null}, lawyer_notes),
        cancelled_by = coalesce(${cancelledBy ?? null}, cancelled_by)
      where id = ${id} and lawyer_id = ${session.lawyerId}
      returning *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Turno no encontrado" });
    return res.status(200).json(rows[0]);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
