// POST /api/payments/create  { appointmentId }
// Crea la preferencia de pago de MercadoPago con SPLIT: el cobro va a la cuenta
// del profesional (su access_token OAuth) y la comisión del 5% (solo plan free)
// se separa automáticamente hacia la plataforma vía marketplace_fee.
//
// Fallback-safe: si MP no está configurado o el profesional no conectó su
// cuenta, devuelve { fallback: true } y el cliente usa el gateway 'demo'.
import { getSql, json, error, mpConfigured, type Handler } from "../../../server/db";

const PLATFORM_FEE_PCT = 0.05; // solo plan 'free'

export const onRequestPost: Handler = async ({ request, env }) => {
  const { appointmentId } = (await request.json()) as { appointmentId: string };
  if (!appointmentId) return error("appointmentId requerido", 400);

  const sql = getSql(env);
  const rows = await sql`
    select a.id, a.price, a.currency, a.status, a.lawyer_id,
           s.name as service_name, l.display_name, l.plan,
           mc.access_token, mc.mp_user_id
    from appointments a
    join services s on s.id = a.service_id
    join lawyers l on l.id = a.lawyer_id
    left join mp_credentials mc on mc.lawyer_id = a.lawyer_id
    where a.id = ${appointmentId}
  `;
  if (rows.length === 0) return error("Turno no encontrado", 404);
  const appt = rows[0]!;

  if (appt.status !== "pending_payment") return error("El turno no está pendiente de pago", 422);
  if (Number(appt.price) === 0) return json({ fallback: true, reason: "free" });

  // Sin MP configurado o sin cuenta conectada → el cliente usa demo
  if (!mpConfigured(env) || !appt.access_token) {
    return json({ fallback: true, reason: "not_connected" });
  }

  const fee =
    appt.plan === "free"
      ? Math.round(Number(appt.price) * PLATFORM_FEE_PCT * 100) / 100
      : 0;

  // El query param ?lawyer= lo preserva MP en la notificación → resuelve qué
  // token usar en el webhook sin tener que adivinar el vendedor.
  const notificationUrl = `${env.APP_URL}/api/mp/webhook?lawyer=${appt.lawyer_id}`;
  const backBase = `${env.APP_URL}/reserva/${appt.id}`;

  const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      // CLAVE DEL SPLIT: token del PROFESIONAL, no de la plataforma
      authorization: `Bearer ${appt.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: `${appt.service_name} — ${appt.display_name}`,
          quantity: 1,
          unit_price: Number(appt.price),
          currency_id: appt.currency,
        },
      ],
      marketplace_fee: fee,
      external_reference: appt.id,
      notification_url: notificationUrl,
      back_urls: {
        success: `${backBase}?pago=ok`,
        pending: `${backBase}?pago=pendiente`,
        failure: `${backBase}?pago=error`,
      },
      auto_return: "approved",
    }),
  });

  if (!prefRes.ok) {
    const detail = await prefRes.text();
    return json({ error: "MercadoPago rechazó la preferencia", detail }, 502);
  }
  const pref = (await prefRes.json()) as { id: string; init_point: string };
  return json({ initPoint: pref.init_point, preferenceId: pref.id });
};

export const onRequest: Handler = () => error("Método no permitido", 405);
