// Autorización con Clerk para Cloudflare Workers: verifica el JWT por request.
// (Equivale al RLS de la versión Supabase, pero en la capa de aplicación.)
import { verifyToken } from "@clerk/backend";
import { getSql, type Env } from "./db";

export interface SessionInfo {
  userId: string; // clerk_user_id
  role: "lawyer" | "client" | "admin";
  lawyerId: string | null;
}

export async function getSession(request: Request, env: Env): Promise<SessionInfo | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyToken(header.slice(7), { secretKey: env.CLERK_SECRET_KEY });
    const userId = payload.sub;
    const sql = getSql(env);
    const rows = await sql`
      select u.role, l.id as lawyer_id
      from users u
      left join lawyers l on l.user_id = u.id
      where u.id = ${userId}
    `;
    if (rows.length === 0) {
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
