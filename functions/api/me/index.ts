// GET  /api/me — sesión (rol + lawyerId)
// POST /api/me — alta de perfil profesional tras el registro Clerk
import { getSql, json, error, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";

export const onRequestGet: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  return json(session);
};

export const onRequestPost: Handler = async ({ request, env }) => {
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);

  const { profile } = (await request.json()) as {
    profile: {
      displayName: string;
      title: string;
      professionalType: string;
      country: string;
      city: string;
      matriculaNumber: string;
      yearsExperience: number;
      bio: string;
      specialties: string[];
    };
  };
  if (!profile?.displayName) return error("Perfil incompleto", 400);
  if (session.lawyerId) return error("Ya tenés perfil profesional", 409);

  const baseSlug = profile.displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const sql = getSql(env);
  await sql`update users set role = 'lawyer' where id = ${session.userId}`;
  const lawyers = await sql`
    insert into lawyers
      (user_id, slug, display_name, title, professional_type, country, city,
       matricula_number, years_experience, bio, specialties)
    values
      (${session.userId}, ${slug}, ${profile.displayName}, ${profile.title},
       ${profile.professionalType}, ${profile.country}, ${profile.city},
       ${profile.matriculaNumber}, ${profile.yearsExperience}, ${profile.bio},
       ${profile.specialties})
    returning id, slug
  `;
  return json(lawyers[0], 201);
};

export const onRequest: Handler = () => error("Método no permitido", 405);
