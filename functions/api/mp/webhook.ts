// POST/GET /api/mp/webhook?lawyer={lawyerId} — notificación de MercadoPago.
// Idempotente: payments.gateway_payment_id es UNIQUE. Confirma el turno cuando
// el pago queda aprobado. El ?lawyer= (preservado por MP) dice qué token usar.
import { getSql, json, type Handler, type Env } from "../../../server/db";
import { videoRoomUrl } from "../../../server/video";

async function process(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const lawyerId = url.searchParams.get("lawyer");

  // El payment id llega por query (?id=, ?data.id=) o en el body { data: { id } }
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (!paymentId) {
    try {
      const body = (await request.json()) as { type?: string; data?: { id?: string } };
      topic = topic ?? body.type ?? null;
      paymentId = body.data?.id ?? null;
    } catch {
      /* sin body */
    }
  }

  if (topic && topic !== "payment") return json({ ok: true, ignored: topic });
  if (!paymentId || !lawyerId) return json({ ok: true, ignored: "sin id o lawyer" });

  const sql = getSql(env);
  const creds = await sql`select access_token from mp_credentials where lawyer_id = ${lawyerId}`;
  if (creds.length === 0) return json({ ok: true, ignored: "lawyer sin credenciales" });

  // Traer el pago con el token del profesional
  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { authorization: `Bearer ${creds[0]!.access_token}` },
  });
  if (!payRes.ok) return json({ ok: true, ignored: "payment lookup falló" });
  const pay = (await payRes.json()) as {
    id: number;
    status: string;
    external_reference: string;
    transaction_amount: number;
    currency_id: string;
  };

  const appointmentId = pay.external_reference;
  if (!appointmentId) return json({ ok: true, ignored: "sin external_reference" });

  const status =
    pay.status === "approved" ? "completed"
    : pay.status === "refunded" ? "refunded"
    : pay.status === "rejected" ? "failed"
    : "pending";

  // Registrar el pago (idempotente por gateway_payment_id único)
  await sql`
    insert into payments (appointment_id, lawyer_id, amount, currency, gateway, gateway_payment_id, status)
    values (${appointmentId}, ${lawyerId}, ${pay.transaction_amount}, ${pay.currency_id},
            'mercadopago', ${String(pay.id)}, ${status})
    on conflict (gateway_payment_id) do update set status = excluded.status
  `;

  if (status === "completed") {
    const updated = await sql`
      update appointments set status = 'confirmed', payment_status = 'paid'
      where id = ${appointmentId} and status = 'pending_payment'
      returning id, modality, starts_at, ends_at, video_room_url
    `;
    // Asignar sala de video a la consulta confirmada (modalidad video)
    if (updated[0]?.modality === "video" && !updated[0].video_room_url) {
      const url = await videoRoomUrl(env, {
        id: String(updated[0].id),
        starts_at: String(updated[0].starts_at),
        ends_at: String(updated[0].ends_at),
      });
      await sql`update appointments set video_room_url = ${url} where id = ${appointmentId}`;
    }
    // TODO: email de confirmación via Resend
  }

  return json({ ok: true });
}

export const onRequestPost: Handler = ({ request, env }) => process(request, env);
export const onRequestGet: Handler = ({ request, env }) => process(request, env);
