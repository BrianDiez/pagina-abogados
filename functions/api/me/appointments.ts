// Agenda del profesional autenticado: GET / PATCH
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const sql = getSql(env);
  const rows = await sql`
    select a.*, c.name as client_name, c.email as client_email, s.name as service_name
    from appointments a
    join clients c on c.id = a.client_id
    join services s on s.id = a.service_id
    where a.lawyer_id = ${session.lawyerId}
    order by a.starts_at
  `;
  return json(rows);
};

export const onRequestPatch: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const { id, status, lawyerNotes, cancelledBy } = (await request.json()) as {
    id: string;
    status?: string;
    lawyerNotes?: string;
    cancelledBy?: string;
  };
  if (!id) return error("id requerido", 400);

  const sql = getSql(env);
  const rows = await sql`
    update appointments set
      status = coalesce(${status ?? null}, status),
      lawyer_notes = coalesce(${lawyerNotes ?? null}, lawyer_notes),
      cancelled_by = coalesce(${cancelledBy ?? null}, cancelled_by)
    where id = ${id} and lawyer_id = ${session.lawyerId}
    returning *
  `;
  if (rows.length === 0) return error("Turno no encontrado", 404);
  return json(rows[0]);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
