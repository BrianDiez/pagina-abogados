// GET /api/mp/status — ¿el profesional autenticado tiene MercadoPago conectado?
// POST /api/mp/status (action=disconnect) — desconecta la cuenta.
import { getSql, json, error, mpConfigured, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return json({ configured: mpConfigured(env), connected: false });

  const sql = getSql(env);
  const rows = await sql`
    select mp_user_id, connected_at from mp_credentials where lawyer_id = ${session.lawyerId}
  `;
  return json({
    configured: mpConfigured(env),
    connected: rows.length > 0,
    mpUserId: rows[0]?.mp_user_id ?? null,
    connectedAt: rows[0]?.connected_at ?? null,
  });
};

export const onRequestPost: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session?.lawyerId) return error("No autorizado", 401);
  const sql = getSql(env);
  await sql`delete from mp_credentials where lawyer_id = ${session.lawyerId}`;
  return json({ connected: false });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
