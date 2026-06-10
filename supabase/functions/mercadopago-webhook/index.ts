// Edge Function: webhook de MercadoPago.
// Idempotente: payments.gateway_payment_id es UNIQUE; un reintento del webhook no duplica.
// Secrets requeridos: MP_ACCESS_TOKEN
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    // MercadoPago manda { type: "payment", data: { id } }
    if (body.type !== "payment" || !body.data?.id) {
      return Response.json({ ok: true, ignored: true });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${body.data.id}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` } },
    );
    if (!mpRes.ok) return Response.json({ error: "MP lookup falló" }, { status: 502 });
    const mp = await mpRes.json();

    const appointmentId = mp.external_reference; // seteado al crear la preferencia
    if (!appointmentId) return Response.json({ ok: true, ignored: true });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const status =
      mp.status === "approved" ? "completed"
      : mp.status === "refunded" ? "refunded"
      : mp.status === "rejected" ? "failed"
      : "pending";

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, lawyer_id, client_id, price, currency")
      .eq("id", appointmentId)
      .single();
    if (!appt) return Response.json({ error: "Turno no encontrado" }, { status: 404 });

    await supabase.from("payments").upsert(
      {
        appointment_id: appt.id,
        lawyer_id: appt.lawyer_id,
        client_id: appt.client_id,
        amount: mp.transaction_amount ?? appt.price,
        currency: mp.currency_id ?? appt.currency,
        gateway: "mercadopago",
        gateway_payment_id: String(mp.id),
        status,
      },
      { onConflict: "gateway_payment_id" },
    );

    if (status === "completed") {
      await supabase
        .from("appointments")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", appt.id)
        .eq("status", "pending_payment");
      // TODO Fase 2: disparar email de confirmación via Resend
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
