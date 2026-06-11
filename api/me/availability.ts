// Disponibilidad semanal del profesional: GET / PUT (reemplazo completo)
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
      select id, day_of_week, start_time, end_time from availability
      where lawyer_id = ${lawyerId} and is_active
      order by day_of_week, start_time
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "PUT") {
    const { rows } = req.body as {
      rows: { dayOfWeek: number; startTime: string; endTime: string }[];
    };
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows requerido" });

    await sql`delete from availability where lawyer_id = ${lawyerId}`;
    for (const r of rows) {
      await sql`
        insert into availability (lawyer_id, day_of_week, start_time, end_time)
        values (${lawyerId}, ${r.dayOfWeek}, ${r.startTime}, ${r.endTime})
      `;
    }
    const created = await sql`
      select id, day_of_week, start_time, end_time from availability
      where lawyer_id = ${lawyerId} and is_active
    `;
    return res.status(200).json(created);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
