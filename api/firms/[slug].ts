// GET /api/firms/:slug — estudio + equipo (con stats de cada profesional)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const slug = String(req.query.slug ?? "");

  const firms = await sql`
    select * from firms where (slug = ${slug} or id::text = ${slug}) and is_active
  `;
  if (firms.length === 0) return res.status(404).json({ error: "Estudio no encontrado" });
  const firm = firms[0]!;

  const members = await sql`
    select l.*, s.avg_rating, s.review_count, s.completed_consultations, s.recommend_pct,
      (select min(price) from services sv where sv.lawyer_id = l.id and sv.is_active) as min_price,
      (select currency from services sv where sv.lawyer_id = l.id and sv.is_active
        order by price asc limit 1) as min_price_currency,
      fm.role as firm_role
    from firm_members fm
    join lawyers l on l.id = fm.lawyer_id
    join lawyer_stats s on s.lawyer_id = l.id
    where fm.firm_id = ${firm.id} and l.is_active
    order by fm.role desc, l.display_name
  `;

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
  return res.status(200).json({ firm, members });
}
