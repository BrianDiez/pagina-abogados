// GET /api/mp/connect — devuelve la URL de autorización OAuth de MercadoPago.
// El profesional (autenticado) la abre y autoriza su cuenta; MP redirige al callback.
import { error, json, mpConfigured, type Handler } from "../../../server/db";
import { getSession } from "../../../server/auth";
import { signState } from "../../../server/mpState";

export const onRequestGet: Handler = async ({ request, env }) => {
  if (!mpConfigured(env)) return error("MercadoPago no está configurado en la plataforma", 503);
  const session = await getSession(request, env);
  if (!session) return error("No autorizado", 401);
  if (!session.lawyerId) return error("Solo los profesionales pueden conectar MercadoPago", 403);

  const state = await signState(env.MP_CLIENT_SECRET!, session.lawyerId);
  const redirectUri = `${env.APP_URL}/api/mp/callback`;
  const url =
    `https://auth.mercadopago.com.uy/authorization?client_id=${env.MP_CLIENT_ID}` +
    `&response_type=code&platform_id=mp&state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return json({ url });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
