// Edge Function: crea la preferencia de pago de un turno con SPLIT DE PAGOS.
//
// Así se cobra la comisión del 5% del plan gratuito SIN facturar después:
//   1. El profesional conectó su cuenta de MercadoPago por OAuth (tabla mp_credentials).
//   2. La preferencia se crea CON EL ACCESS TOKEN DEL PROFESIONAL (el cobro es suyo)
//      y con `marketplace_fee` = 5% si su plan es 'free' (0 en planes pagos).
//   3. MercadoPago descuenta primero su propia tarifa y luego transfiere
//      el marketplace_fee a la cuenta de LegalHub automáticamente.
//   El dinero llega repartido en el momento del pago: sin deudas, sin cobranzas.
//
// Regla de producto: en plan free solo se cobra via MercadoPago (la transferencia
// bancaria manual no permite split, queda reservada a planes pagos).
//
// Secrets requeridos: ninguno extra (usa los tokens OAuth guardados por lawyer).
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLATFORM_FEE_PCT = 0.05; // solo plan 'free'

Deno.serve(async (req) => {
  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) {
      return Response.json({ error: "appointment_id requerido" }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, price, currency, status, lawyer_id, services(name), lawyers(plan, display_name)")
      .eq("id", appointment_id)
      .single();
    if (!appt) return Response.json({ error: "Turno no encontrado" }, { status: 404 });
    if (appt.status !== "pending_payment") {
      return Response.json({ error: "El turno no está pendiente de pago" }, { status: 422 });
    }

    // Token OAuth del profesional (obtenido en el flujo "Conectar MercadoPago")
    const { data: creds } = await supabase
      .from("mp_credentials")
      .select("access_token")
      .eq("lawyer_id", appt.lawyer_id)
      .single();
    if (!creds) {
      return Response.json(
        { error: "El profesional no conectó su cuenta de MercadoPago" },
        { status: 422 },
      );
    }

    const lawyer = appt.lawyers as unknown as { plan: string; display_name: string };
    const service = appt.services as unknown as { name: string };
    const marketplaceFee =
      lawyer.plan === "free" ? Math.round(appt.price * PLATFORM_FEE_PCT * 100) / 100 : 0;

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        // CLAVE DEL SPLIT: el token es del PROFESIONAL, no de la plataforma.
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `${service.name} — ${lawyer.display_name}`,
            quantity: 1,
            unit_price: appt.price,
            currency_id: appt.currency,
          },
        ],
        marketplace_fee: marketplaceFee, // 5% a LegalHub solo en plan free
        external_reference: appt.id, // lo lee el webhook para confirmar el turno
        back_urls: {
          success: `${Deno.env.get("APP_URL")}/reserva/${appt.id}/confirmada`,
          failure: `${Deno.env.get("APP_URL")}/reserva/${appt.id}/error`,
        },
        auto_return: "approved",
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      }),
    });

    if (!mpRes.ok) {
      const detail = await mpRes.text();
      return Response.json({ error: "MercadoPago falló", detail }, { status: 502 });
    }

    const pref = await mpRes.json();
    return Response.json({ init_point: pref.init_point, preference_id: pref.id });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
