// Sala de videollamada para un turno confirmado.
//  - Con DAILY_API_KEY: crea una sala privada Daily.co con ventana horaria
//    (5 min antes a 15 min después) + chat + compartir pantalla.
//  - Sin key (default): URL de Jitsi Meet (gratis, sin cuenta, en navegador y
//    móvil). El id del turno (uuid) la hace imposible de adivinar.
import type { Env } from "./db";

interface VideoAppt {
  id: string;
  starts_at: string;
  ends_at: string;
}

export async function videoRoomUrl(env: Env, appt: VideoAppt): Promise<string> {
  if (env.DAILY_API_KEY) {
    try {
      const nbf = Math.floor(new Date(appt.starts_at).getTime() / 1000) - 5 * 60;
      const exp = Math.floor(new Date(appt.ends_at).getTime() / 1000) + 15 * 60;
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.DAILY_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: `legalhub-${appt.id}`,
          privacy: "private",
          properties: { nbf, exp, enable_chat: true, enable_screenshare: true },
        }),
      });
      if (res.ok) {
        const room = (await res.json()) as { url: string };
        if (room.url) return room.url;
      }
    } catch {
      /* si Daily falla, cae a Jitsi abajo */
    }
  }
  // Jitsi: la sala existe con solo abrir la URL. El uuid del turno la protege.
  return `https://meet.jit.si/legalhub-${appt.id}`;
}
