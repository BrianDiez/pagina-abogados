// Autorización con Clerk: la API verifica el JWT en cada request.
// (Equivale al RLS de la versión Supabase, pero en la capa de aplicación.)
import { verifyToken } from "@clerk/backend";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./db";

export interface SessionInfo {
  userId: string; // clerk_user_id
  role: "lawyer" | "client" | "admin";
  lawyerId: string | null;
}

/** Devuelve la sesión o null (endpoints con auth opcional). */
export async function getSession(req: VercelRequest): Promise<SessionInfo | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyToken(header.slice(7), {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const userId = payload.sub;
    const rows = await sql`
      select u.role, l.id as lawyer_id
      from users u
      left join lawyers l on l.user_id = u.id
      where u.id = ${userId}
    `;
    if (rows.length === 0) {
      // primer login: crear el espejo del usuario Clerk como cliente
      const email = (payload as Record<string, unknown>).email ?? "";
      await sql`
        insert into users (id, email, role) values (${userId}, ${String(email)}, 'client')
        on conflict (id) do nothing
      `;
      return { userId, role: "client", lawyerId: null };
    }
    return {
      userId,
      role: rows[0]!.role as SessionInfo["role"],
      lawyerId: (rows[0]!.lawyer_id as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Corta con 401 si no hay sesión válida. */
export async function requireSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<SessionInfo | null> {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "No autorizado" });
    return null;
  }
  return session;
}
