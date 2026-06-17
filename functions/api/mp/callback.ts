// GET /api/mp/callback?code=&state= — MercadoPago redirige acá tras autorizar.
// Verifica el state, canjea el code por tokens y los guarda en mp_credentials.
import { getSql, mpConfigured, type Handler } from "../../../server/db";
import { verifyState } from "../../../server/mpState";

function redirectTo(env: { APP_URL?: string }, qs: string): Response {
  return Response.redirect(`${env.APP_URL}/dashboard/configuracion?${qs}`, 302);
}

export const onRequestGet: Handler = async ({ request, env }) => {
  if (!mpConfigured(env)) return new Response("MercadoPago no configurado", { status: 503 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  const lawyerId = await verifyState(env.MP_CLIENT_SECRET!, state);
  if (!lawyerId || !code) return redirectTo(env, "mp=error&motivo=estado");

  // Canje del authorization_code por tokens
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.MP_CLIENT_ID,
      client_secret: env.MP_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.APP_URL}/api/mp/callback`,
    }),
  });
  if (!res.ok) return redirectTo(env, "mp=error&motivo=token");
  const tok = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    user_id: number | string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + (tok.expires_in ?? 0) * 1000).toISOString();
  const sql = getSql(env);
  await sql`
    insert into mp_credentials (lawyer_id, mp_user_id, access_token, refresh_token, expires_at)
    values (${lawyerId}, ${String(tok.user_id)}, ${tok.access_token}, ${tok.refresh_token}, ${expiresAt})
    on conflict (lawyer_id) do update set
      mp_user_id = excluded.mp_user_id,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      connected_at = now()
  `;

  return redirectTo(env, "mp=conectado");
};

export const onRequest: Handler = () => new Response("Método no permitido", { status: 405 });
