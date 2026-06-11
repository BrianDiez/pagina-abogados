// Servicios del profesional autenticado: GET / POST / PATCH / DELETE
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession, type SessionInfo } from "../../../server/auth";

type AuthResult =
  | { ok: false; res: Response }
  | { ok: true; session: SessionInfo & { lawyerId: string } };

async function requireLawyer(
  request: Request,
  env: Parameters<typeof getSession>[1],
): Promise<AuthResult> {
  const session = await getSession(request, env);
  if (!session) return { ok: false, res: error("No autorizado", 401) };
  if (!session.lawyerId) return { ok: false, res: error("No sos profesional", 403) };
  return { ok: true, session: session as SessionInfo & { lawyerId: string } };
}

export const onRequestGet: Handler = async ({ request, env }) => {
  const auth = await requireLawyer(request, env);
  if (!auth.ok) return auth.res;
  const sql = getSql(env);
  const rows = await sql`
    select * from services where lawyer_id = ${auth.session.lawyerId} and is_active order by price
  `;
  return json(rows);
};

export const onRequestPost: Handler = async ({ request, env }) => {
  const auth = await requireLawyer(request, env);
  if (!auth.ok) return auth.res;
  const s = (await request.json()) as Record<string, unknown>;
  const sql = getSql(env);
  const rows = await sql`
    insert into services
      (lawyer_id, name, description, duration_minutes, price, currency,
       modality, min_advance_hours, break_after_minutes)
    values
      (${auth.session.lawyerId}, ${s.name}, ${s.description}, ${s.durationMinutes}, ${s.price},
       ${s.currency}, ${s.modality}, ${s.minAdvanceHours ?? 2}, ${s.breakAfterMinutes ?? 0})
    returning *
  `;
  return json(rows[0], 201);
};

export const onRequestPatch: Handler = async ({ request, env }) => {
  const auth = await requireLawyer(request, env);
  if (!auth.ok) return auth.res;
  const s = (await request.json()) as Record<string, unknown>;
  if (!s.id) return error("id requerido", 400);
  const sql = getSql(env);
  const rows = await sql`
    update services set
      name = coalesce(${s.name ?? null}, name),
      description = coalesce(${s.description ?? null}, description),
      duration_minutes = coalesce(${s.durationMinutes ?? null}, duration_minutes),
      price = coalesce(${s.price ?? null}, price),
      currency = coalesce(${s.currency ?? null}, currency),
      modality = coalesce(${s.modality ?? null}, modality),
      min_advance_hours = coalesce(${s.minAdvanceHours ?? null}, min_advance_hours),
      break_after_minutes = coalesce(${s.breakAfterMinutes ?? null}, break_after_minutes)
    where id = ${s.id} and lawyer_id = ${auth.session.lawyerId}
    returning *
  `;
  if (rows.length === 0) return error("Servicio no encontrado", 404);
  return json(rows[0]);
};

export const onRequestDelete: Handler = async ({ request, env }) => {
  const auth = await requireLawyer(request, env);
  if (!auth.ok) return auth.res;
  const id = new URL(request.url).searchParams.get("id");
  const sql = getSql(env);
  await sql`update services set is_active = false where id = ${id} and lawyer_id = ${auth.session.lawyerId}`;
  return new Response(null, { status: 204 });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
