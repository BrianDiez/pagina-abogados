// GET /api/slots?lawyerId=&serviceId=&from=YYYY-MM-DD&days=N
import { getSql, json, error, type Handler } from "../../server/db";

export const onRequestGet: Handler = async ({ request, env }) => {
  const url = new URL(request.url);
  const lawyerId = url.searchParams.get("lawyerId");
  const serviceId = url.searchParams.get("serviceId");
  const from = url.searchParams.get("from");
  const days = url.searchParams.get("days");
  if (!lawyerId || !serviceId || !from) {
    return error("lawyerId, serviceId y from son requeridos", 400);
  }
  const to = new Date(from);
  to.setDate(to.getDate() + Math.min(Number(days ?? 21), 60));

  const sql = getSql(env);
  const rows = await sql`
    select slot_start, slot_end
    from get_available_slots(
      ${lawyerId}::uuid, ${serviceId}::uuid,
      ${from}::date, ${to.toISOString().slice(0, 10)}::date
    )
  `;
  return json(rows.map((r) => ({ start: r.slot_start, end: r.slot_end })));
};

export const onRequest: Handler = () => error("Método no permitido", 405);
