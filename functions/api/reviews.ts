// POST  /api/reviews — el cliente reseña una consulta completada suya
// PATCH /api/reviews — el profesional responde { id, response }
import { getSql, json, error, type Handler } from "../../server/db";
import { getSession } from "../../server/auth";

export const onRequestPost: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);

  const r = (await request.json()) as {
    appointmentId: string;
    ratingOverall: number;
    textReview: string;
    wouldRecommend: boolean;
    isAnonymous?: boolean;
  };
  if (!r.appointmentId || !r.ratingOverall) return error("Datos incompletos", 400);

  const sql = getSql(env);
  const appts = await sql`
    select a.id, a.lawyer_id, a.client_id from appointments a
    join clients c on c.id = a.client_id
    where a.id = ${r.appointmentId}
      and (c.user_id = ${session.userId}
           or c.email = (select email from users where id = ${session.userId}))
  `;
  if (appts.length === 0) return error("Esta consulta no es tuya", 403);

  try {
    const rows = await sql`
      insert into reviews
        (lawyer_id, client_id, appointment_id, rating_overall, text_review,
         would_recommend, is_anonymous)
      values
        (${appts[0]!.lawyer_id}, ${appts[0]!.client_id}, ${r.appointmentId},
         ${r.ratingOverall}, ${r.textReview}, ${r.wouldRecommend}, ${r.isAnonymous ?? false})
      returning *
    `;
    return json(rows[0], 201);
  } catch (e) {
    const message = String(e);
    if (message.includes("reviews_appointment_id_key")) {
      return error("Esta consulta ya tiene una reseña", 409);
    }
    if (message.includes("Solo se puede") || message.includes("ventana")) {
      return error(message.split("ERROR:").pop()?.trim() ?? message, 422);
    }
    throw e;
  }
};

export const onRequestPatch: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const { id, response } = (await request.json()) as { id: string; response: string };
  const sql = getSql(env);
  const rows = await sql`
    update reviews set lawyer_response = ${response}
    where id = ${id} and lawyer_id = ${session.lawyerId}
    returning *
  `;
  if (rows.length === 0) return error("Reseña no encontrada", 404);
  return json(rows[0]);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
