// GET /api/me — perfil de sesión (rol + lawyerId) a partir del token de Clerk.
// POST /api/me — completa el alta de profesional tras el registro Clerk
//   body: { role: 'lawyer', profile: { displayName, title, ... } }
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "./_lib/auth";
import { sql } from "./_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") {
    return res.status(200).json(session);
  }

  if (req.method === "POST") {
    const { profile } = req.body as {
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
    if (!profile?.displayName) return res.status(400).json({ error: "Perfil incompleto" });
    if (session.lawyerId) return res.status(409).json({ error: "Ya tenés perfil profesional" });

    const baseSlug = profile.displayName
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

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
    return res.status(201).json(lawyers[0]);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
