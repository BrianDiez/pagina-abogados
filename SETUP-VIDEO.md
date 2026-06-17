# Videollamadas

Las videollamadas **ya funcionan sin configurar nada**: cada turno confirmado de
modalidad "Videollamada" recibe una sala real de **Jitsi Meet** (gratis, sin
cuenta, en navegador y celular, con chat y compartir pantalla). El link aparece
en la confirmación, en "Mis consultas" del cliente y en la agenda del profesional
("Entrar a la sala" / "Unirme").

> El id del turno (UUID) hace que la URL sea imposible de adivinar. Para una
> consulta 1‑a‑1 con link privado, alcanza.

## Upgrade opcional a Daily.co (salas privadas + grabación)

Si querés salas con **ventana horaria** (solo activas alrededor del turno),
**sala de espera** y **grabación con consentimiento**, agregá Daily.co:

1. Crear cuenta gratis en [daily.co](https://www.daily.co) (free: 10.000
   minutos/mes) → Developers → copiar la **API key**.
2. En Cloudflare Pages → Variables (Production): `DAILY_API_KEY = ...` → Retry
   deployment.
3. Listo: a partir de ahí, las salas nuevas se crean en Daily (privadas, válidas
   desde 5 min antes hasta 15 min después del turno). Si Daily fallara, cae a
   Jitsi automáticamente.

## Cómo funciona (técnico)

- `server/video.ts` → `videoRoomUrl(env, appt)`: con `DAILY_API_KEY` crea una
  sala Daily (`/v1/rooms`, privada, con `nbf`/`exp`); sin key devuelve
  `https://meet.jit.si/legalhub-{appointmentId}`.
- Se asigna al confirmarse el turno: reserva gratuita (POST), pago demo (PATCH)
  y webhook de MercadoPago. Idempotente (no recrea si ya hay sala).
- **Pendiente Fase 2**: sala de espera con branding, grabación a R2 con
  consentimiento explícito, subtítulos.
