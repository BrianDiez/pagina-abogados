// GET /api/slots?lawyerId=&serviceId=&from=YYYY-MM-DD&days=N
// La función SQL get_available_slots es la única fuente de verdad de disponibilidad.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const { lawyerId, serviceId, from, days } = req.query as Record<string, string>;
  if (!lawyerId || !serviceId || !from) {
    return res.status(400).json({ error: "lawyerId, serviceId y from son requeridos" });
  }
  const to = new Date(from);
  to.setDate(to.getDate() + Math.min(Number(days ?? 21), 60));

  const rows = await sql`
    select slot_start, slot_end
    from get_available_slots(
      ${lawyerId}::uuid, ${serviceId}::uuid,
      ${from}::date, ${to.toISOString().slice(0, 10)}::date
    )
  `;
  return res.status(200).json(rows.map((r) => ({ start: r.slot_start, end: r.slot_end })));
}
