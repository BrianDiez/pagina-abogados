// PATCH /api/me/profile — edición del perfil del profesional autenticado
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestPatch: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("No sos profesional", 403);

  const p = (await request.json()) as Record<string, unknown>;
  const sql = getSql(env);
  const rows = await sql`
    update lawyers set
      bio = coalesce(${p.bio ?? null}, bio),
      phone = coalesce(${p.phone ?? null}, phone),
      photo_url = coalesce(${p.photoUrl ?? null}, photo_url),
      accepts_new_clients = coalesce(${p.acceptsNewClients ?? null}, accepts_new_clients)
    where id = ${session.lawyerId}
    returning *
  `;
  return json(rows[0]);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
