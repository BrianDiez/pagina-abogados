// Disponibilidad semanal del profesional: GET / PUT (reemplazo completo)
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const sql = getSql(env);
  const rows = await sql`
    select id, day_of_week, start_time, end_time from availability
    where lawyer_id = ${session.lawyerId} and is_active
    order by day_of_week, start_time
  `;
  return json(rows);
};

export const onRequestPut: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const { rows } = (await request.json()) as {
    rows: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
  if (!Array.isArray(rows)) return error("rows requerido", 400);

  const sql = getSql(env);
  await sql`delete from availability where lawyer_id = ${session.lawyerId}`;
  for (const r of rows) {
    await sql`
      insert into availability (lawyer_id, day_of_week, start_time, end_time)
      values (${session.lawyerId}, ${r.dayOfWeek}, ${r.startTime}, ${r.endTime})
    `;
  }
  const created = await sql`
    select id, day_of_week, start_time, end_time from availability
    where lawyer_id = ${session.lawyerId} and is_active
  `;
  return json(created);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
