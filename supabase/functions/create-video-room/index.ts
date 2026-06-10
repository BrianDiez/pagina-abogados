// Edge Function: crea una sala de Daily.co para un turno confirmado.
// Secrets requeridos: DAILY_API_KEY
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, modality, video_room_url")
      .eq("id", appointment_id)
      .single();

    if (error || !appt) {
      return Response.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    if (appt.video_room_url) {
      return Response.json({ room_url: appt.video_room_url }); // idempotente
    }
    if (appt.modality !== "video" || appt.status !== "confirmed") {
      return Response.json({ error: "El turno no admite videollamada" }, { status: 422 });
    }

    // Sala válida desde 5 min antes hasta 15 min después del turno
    const nbf = Math.floor(new Date(appt.starts_at).getTime() / 1000) - 5 * 60;
    const exp = Math.floor(new Date(appt.ends_at).getTime() / 1000) + 15 * 60;

    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("DAILY_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `legalhub-${appt.id}`,
        privacy: "private",
        properties: { nbf, exp, enable_chat: true, enable_screenshare: true },
      }),
    });

    if (!dailyRes.ok) {
      const detail = await dailyRes.text();
      return Response.json({ error: "Daily.co falló", detail }, { status: 502 });
    }

    const room = await dailyRes.json();
    await supabase
      .from("appointments")
      .update({ video_room_url: room.url, video_room_id: room.name })
      .eq("id", appt.id);

    return Response.json({ room_url: room.url, room_id: room.name });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
