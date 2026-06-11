// POST  /api/reviews — el cliente reseña una consulta completada suya
// PATCH /api/reviews — el profesional responde públicamente { id, response }
// La integridad (consulta completada, ventana 30 días, 1 por turno) la
// garantiza el trigger validate_review en Postgres.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "./_lib/auth";
import { sql } from "./_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === "POST") {
    const r = req.body as {
      appointmentId: string;
      ratingOverall: number;
      textReview: string;
      wouldRecommend: boolean;
      isAnonymous?: boolean;
    };
    if (!r.appointmentId || !r.ratingOverall) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // la consulta debe pertenecer al cliente autenticado (por email o user_id)
    const appts = await sql`
      select a.id, a.lawyer_id, a.client_id from appointments a
      join clients c on c.id = a.client_id
      where a.id = ${r.appointmentId}
        and (c.user_id = ${session.userId}
             or c.email = (select email from users where id = ${session.userId}))
    `;
    if (appts.length === 0) return res.status(403).json({ error: "Esta consulta no es tuya" });

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
      return res.status(201).json(rows[0]);
    } catch (e) {
      const message = String(e);
      if (message.includes("reviews_appointment_id_key")) {
        return res.status(409).json({ error: "Esta consulta ya tiene una reseña" });
      }
      if (message.includes("Solo se puede") || message.includes("ventana")) {
        return res.status(422).json({ error: message.split("ERROR:").pop()?.trim() ?? message });
      }
      throw e;
    }
  }

  if (req.method === "PATCH") {
    if (!session.lawyerId) return res.status(403).json({ error: "No sos profesional" });
    const { id, response } = req.body as { id: string; response: string };
    const rows = await sql`
      update reviews set lawyer_response = ${response}
      where id = ${id} and lawyer_id = ${session.lawyerId}
      returning *
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Reseña no encontrada" });
    return res.status(200).json(rows[0]);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
