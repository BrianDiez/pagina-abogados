// GET /api/lawyers/:slug — bundle del perfil público (acepta slug o uuid)
import { getSql, json, error, type Handler } from "../../../server/db";

export const onRequestGet: Handler = async ({ env, params }) => {
  const slug = String(params.slug ?? "");
  const sql = getSql(env);

  const lawyers = await sql`
    select l.*, s.avg_rating, s.review_count, s.completed_consultations, s.recommend_pct
    from lawyers l join lawyer_stats s on s.lawyer_id = l.id
    where (l.slug = ${slug} or l.id::text = ${slug}) and l.is_active
  `;
  if (lawyers.length === 0) return error("Perfil no encontrado", 404);
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

  sql`update lawyers set profile_views = profile_views + 1 where id = ${lawyer.id}`.catch(
    () => {},
  );

  return json(
    { lawyer, services, reviews, availability, firm: firm[0] ?? null },
    200,
    { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
  );
};

export const onRequest: Handler = () => error("Método no permitido", 405);
