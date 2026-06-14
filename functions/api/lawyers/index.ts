// GET /api/lawyers?especialidad=&ciudad=&modalidad=&tipo=&q= — directorio público
import { getSql, json, error, type Handler } from "../../../server/db";

export const onRequestGet: Handler = async ({ request, env }) => {
  const url = new URL(request.url);
  const especialidad = url.searchParams.get("especialidad");
  const provincia = url.searchParams.get("provincia");
  const modalidad = url.searchParams.get("modalidad");
  const tipo = url.searchParams.get("tipo");
  const q = url.searchParams.get("q");

  const sql = getSql(env);
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
      and (${especialidad}::text is null or ${especialidad} = any(l.specialties))
      and (${provincia}::text is null or l.province = ${provincia})
      and (${modalidad}::text is null or ${modalidad} = any(l.modalities))
      and (${tipo}::text is null or l.professional_type = ${tipo})
      and (${q}::text is null
           or l.display_name ilike '%' || ${q ?? ""} || '%'
           or l.bio ilike '%' || ${q ?? ""} || '%'
           or l.city ilike '%' || ${q ?? ""} || '%')
    order by l.is_verified desc, s.avg_rating desc nulls last, s.review_count desc
    limit 100
  `;
  return json(rows, 200, { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" });
};

// Cualquier método sin handler específico cae acá (onRequestGet tiene precedencia)
export const onRequest: Handler = () => error("Método no permitido", 405);
