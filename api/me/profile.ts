// PATCH /api/me/profile — edición del perfil del profesional autenticado
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/auth";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Método no permitido" });
  const session = await requireSession(req, res);
  if (!session) return;
  if (!session.lawyerId) return res.status(403).json({ error: "No sos profesional" });

  const p = req.body as Record<string, unknown>;
  const rows = await sql`
    update lawyers set
      bio = coalesce(${p.bio ?? null}, bio),
      phone = coalesce(${p.phone ?? null}, phone),
      photo_url = coalesce(${p.photoUrl ?? null}, photo_url),
      accepts_new_clients = coalesce(${p.acceptsNewClients ?? null}, accepts_new_clients)
    where id = ${session.lawyerId}
    returning *
  `;
  return res.status(200).json(rows[0]);
}
