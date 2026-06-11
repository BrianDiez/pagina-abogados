// GET /api/firms — directorio público de estudios
import { getSql, json, error, type Handler } from "../../../server/db";

export const onRequestGet: Handler = async ({ env }) => {
  const sql = getSql(env);
  const rows = await sql`
    select f.*,
      (select count(*) from firm_members fm where fm.firm_id = f.id) as member_count
    from firms f
    where f.is_active
    order by f.is_verified desc, f.name
  `;
  return json(rows, 200, { "cache-control": "public, s-maxage=120, stale-while-revalidate=600" });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
