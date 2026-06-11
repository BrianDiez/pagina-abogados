// Consultas al estudio: POST público · GET/PATCH solo miembros
import { getSql, json, error, type Handler, type Env } from "../../server/db";
import { getSession } from "../../server/auth";

async function isMember(env: Env, lawyerId: string | null, firmId: string): Promise<boolean> {
  if (!lawyerId) return false;
  const sql = getSql(env);
  const rows = await sql`
    select 1 from firm_members where firm_id = ${firmId} and lawyer_id = ${lawyerId}
  `;
  return rows.length > 0;
}

export const onRequestPost: Handler = async ({ request, env }) => {
  const i = (await request.json()) as {
    firmId: string;
    name: string;
    email: string;
    phone?: string;
    specialty?: string;
    message: string;
  };
  if (!i.firmId || !i.name || !i.email || !i.message) return error("Datos incompletos", 400);

  const sql = getSql(env);
  const rows = await sql`
    insert into firm_inquiries (firm_id, name, email, phone, specialty, message)
    values (${i.firmId}, ${i.name}, ${i.email}, ${i.phone ?? null},
            ${i.specialty ?? null}, ${i.message})
    returning *
  `;
  // TODO: email al estudio via Resend cuando haya RESEND_API_KEY
  return json(rows[0], 201);
};

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  const firmId = new URL(request.url).searchParams.get("firmId") ?? "";
  if (!(await isMember(env, session.lawyerId, firmId))) {
    return error("No sos miembro de este estudio", 403);
  }
  const sql = getSql(env);
  const rows = await sql`
    select * from firm_inquiries where firm_id = ${firmId} order by created_at desc
  `;
  return json(rows);
};

export const onRequestPatch: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  const { id } = (await request.json()) as { id: string };
  const sql = getSql(env);
  const inquiries = await sql`select firm_id from firm_inquiries where id = ${id}`;
  if (inquiries.length === 0) return error("No encontrada", 404);
  if (!(await isMember(env, session.lawyerId, String(inquiries[0]!.firm_id)))) {
    return error("No sos miembro de este estudio", 403);
  }
  await sql`update firm_inquiries set is_read = true where id = ${id}`;
  return new Response(null, { status: 204 });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
