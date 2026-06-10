// Edge Function: recordatorios de turnos. Pensada para cron horario:
//   select cron.schedule('reminders', '0 * * * *', $$ select net.http_post(...) $$);
// Secrets requeridos: RESEND_API_KEY
import { createClient } from "jsr:@supabase/supabase-js@2";

const WINDOWS = [
  { hoursAhead: 24, tag: "reminder_24h" },
  { hoursAhead: 2, tag: "reminder_2h" },
];

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let sent = 0;
  for (const w of WINDOWS) {
    const from = new Date(Date.now() + w.hoursAhead * 3600_000);
    const to = new Date(from.getTime() + 3600_000); // ventana de 1h (cron horario)

    const { data: appts } = await supabase
      .from("appointments")
      .select(
        "id, starts_at, modality, video_room_url, services(name), lawyers(display_name), clients(name, email)",
      )
      .eq("status", "confirmed")
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString());

    for (const a of appts ?? []) {
      const client = a.clients as unknown as { name: string; email: string };
      const lawyer = a.lawyers as unknown as { display_name: string };
      const service = a.services as unknown as { name: string };
      const when = new Date(a.starts_at).toLocaleString("es-UY", {
        timeZone: "America/Montevideo",
        dateStyle: "full",
        timeStyle: "short",
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LegalHub <recordatorios@legalhub.app>",
          to: client.email,
          subject: `Recordatorio: consulta con ${lawyer.display_name}`,
          html: `<p>Hola ${client.name},</p>
            <p>Te recordamos tu consulta <strong>${service.name}</strong> con
            <strong>${lawyer.display_name}</strong> el <strong>${when}</strong>.</p>
            ${a.video_room_url ? `<p><a href="${a.video_room_url}">Entrar a la videollamada</a></p>` : ""}
            <p>— LegalHub</p>`,
        }),
      });
      sent++;
    }
  }

  return Response.json({ ok: true, sent });
});
