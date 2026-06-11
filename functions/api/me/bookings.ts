// GET /api/me/bookings — consultas del cliente autenticado (sin lawyer_notes)
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);

  const sql = getSql(env);
  const rows = await sql`
    select a.id, a.lawyer_id, a.client_id, a.service_id, a.status, a.starts_at,
           a.ends_at, a.modality, a.client_notes, a.video_room_url, a.price,
           a.currency, a.payment_status,
           s.name as service_name, l.display_name as lawyer_name, l.slug as lawyer_slug,
           c.name as client_name, c.email as client_email
    from appointments a
    join clients c on c.id = a.client_id
    join services s on s.id = a.service_id
    join lawyers l on l.id = a.lawyer_id
    where c.email = (select email from users where id = ${session.userId})
       or c.user_id = ${session.userId}
    order by a.starts_at desc
  `;
  return json(rows);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
