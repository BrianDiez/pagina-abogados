// Servicios del profesional autenticado: GET / POST / PATCH / DELETE
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/auth";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;
  if (!session.lawyerId) return res.status(403).json({ error: "No sos profesional" });
  const lawyerId = session.lawyerId;

  if (req.method === "GET") {
    const rows = await sql`
      select * from services where lawyer_id = ${lawyerId} and is_active order by price
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const s = req.body as Record<string, unknown>;
    const rows = await sql`
      insert into services
        (lawyer_id, name, description, duration_minutes, price, currency,
         modality, min_advance_hours, break_after_minutes)
      values
        (${lawyerId}, ${s.name}, ${s.description}, ${s.durationMinutes}, ${s.price},
         ${s.currency}, ${s.modality}, ${s.minAdvanceHours ?? 2}, ${s.breakAfterMinutes ?? 0})
      returning *
    `;
    return res.status(201).json(rows[0]);
  }

  if (req.method === "PATCH") {
    const s = req.body as Record<string, unknown>;
    if (!s.id) return res.status(400).json({ error: "id requerido" });
    const rows = await sql`
      update services set
        name = coalesce(${s.name ?? null}, name),
        description = coalesce(${s.description ?? null}, description),
        duration_minutes = coalesce(${s.durationMinutes ?? null}, duration_minutes),
        price = coalesce(${s.price ?? null}, price),
        currency = coalesce(${s.currency ?? null}, currency),
        modality = coalesce(${s.modality ?? null}, modality),
        min_advance_hours = coalesce(${s.minAdvanceHours ?? null}, min_advance_hours),
        break_after_minutes = coalesce(${s.breakAfterMinutes ?? null}, break_after_minutes)
      where id = ${s.id} and lawyer_id = ${lawyerId}
      returning *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Servicio no encontrado" });
    return res.status(200).json(rows[0]);
  }

  if (req.method === "DELETE") {
    const { id } = req.query as Record<string, string>;
    await sql`update services set is_active = false where id = ${id} and lawyer_id = ${lawyerId}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Método no permitido" });
}
