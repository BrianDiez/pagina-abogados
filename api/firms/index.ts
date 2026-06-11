// GET /api/firms — directorio público de estudios
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const rows = await sql`
    select f.*,
      (select count(*) from firm_members fm where fm.firm_id = f.id) as member_count
    from firms f
    where f.is_active
    order by f.is_verified desc, f.name
  `;
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
  return res.status(200).json(rows);
}
