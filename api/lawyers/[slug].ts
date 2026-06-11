// GET /api/lawyers/:slug — bundle del perfil público:
// profesional + servicios + reseñas + disponibilidad + estudio (afiliación)
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const slug = String(req.query.slug ?? "");

  // acepta slug (perfil público) o uuid (panel del profesional)
  const lawyers = await sql`
    select l.*, s.avg_rating, s.review_count, s.completed_consultations, s.recommend_pct
    from lawyers l join lawyer_stats s on s.lawyer_id = l.id
    where (l.slug = ${slug} or l.id::text = ${slug}) and l.is_active
  `;
  if (lawyers.length === 0) return res.status(404).json({ error: "Perfil no encontrado" });
  const lawyer = lawyers[0]!;

  const [services, reviews, availability, firm] = await Promise.all([
    sql`select * from services where lawyer_id = ${lawyer.id} and is_active order by price`,
    sql`select id, rating_overall, text_review, would_recommend,
          case when is_anonymous then 'Anónimo' else
            (select name from clients c where c.id = reviews.client_id) end as client_name,
          specialty_consulted, lawyer_response, created_at
        from reviews
        where lawyer_id = ${lawyer.id} and is_published
        order by created_at desc limit 50`,
    sql`select day_of_week, start_time, end_time from availability
        where lawyer_id = ${lawyer.id} and is_active`,
    sql`select f.id, f.slug, f.name, f.logo_url from firms f
        join firm_members fm on fm.firm_id = f.id
        where fm.lawyer_id = ${lawyer.id} and f.is_active limit 1`,
  ]);

  // contador de vistas, sin bloquear la respuesta
  sql`update lawyers set profile_views = profile_views + 1 where id = ${lawyer.id}`.catch(() => {});

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json({ lawyer, services, reviews, availability, firm: firm[0] ?? null });
}
