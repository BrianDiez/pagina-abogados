// GET /api/lawyers?especialidad=&ciudad=&modalidad=&tipo=&q= — directorio público
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const { especialidad, ciudad, modalidad, tipo, q } = req.query as Record<string, string>;

  const rows = await sql`
    select l.*, s.avg_rating, s.review_count, s.completed_consultations, s.recommend_pct,
      (select min(price) from services sv where sv.lawyer_id = l.id and sv.is_active) as min_price,
      (select currency from services sv where sv.lawyer_id = l.id and sv.is_active
        order by price asc limit 1) as min_price_currency,
      exists (
        select 1 from availability a
        where a.lawyer_id = l.id and a.is_active
          and a.day_of_week = extract(dow from now() at time zone 'America/Montevideo')::int
      ) as available_today
    from lawyers l
    join lawyer_stats s on s.lawyer_id = l.id
    where l.is_active
      and (${especialidad ?? null}::text is null or ${especialidad ?? null} = any(l.specialties))
      and (${ciudad ?? null}::text is null or l.city = ${ciudad ?? null})
      and (${modalidad ?? null}::text is null or ${modalidad ?? null} = any(l.modalities))
      and (${tipo ?? null}::text is null or l.professional_type = ${tipo ?? null})
      and (${q ?? null}::text is null
           or l.display_name ilike '%' || ${q ?? ""} || '%'
           or l.bio ilike '%' || ${q ?? ""} || '%'
           or l.city ilike '%' || ${q ?? ""} || '%')
    order by l.is_verified desc, s.avg_rating desc nulls last, s.review_count desc
    limit 100
  `;

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json(rows);
}
