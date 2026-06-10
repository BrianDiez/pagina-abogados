# LegalHub ⚖️

Plataforma SaaS para **abogados, escribanos y notarios en LATAM** (Uruguay y Argentina):
perfil profesional verificado, agenda online, cobro de consultas, videollamada integrada
y sistema de reseñas — todo en un solo lugar.

> El equivalente a Encuadrado.com, 100% especializado en el sector legal.

## 🚀 Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción
```

La app arranca en **modo demo** (`VITE_DEMO_MODE=true`): funciona completa con datos
de ejemplo locales (12 profesionales, reseñas, agenda con turnos), sin backend.

**Cuentas demo** (contraseña `demo1234`):
- Profesional: `abogado@legalhub.app` → panel completo con agenda, servicios, estadísticas
- Cliente: `cliente@legalhub.app` → historial de consultas y reseñas

## 🗄️ Conectar el backend real (Supabase)

El esquema completo está listo en `supabase/migrations/` (3 archivos: schema, RLS, funciones).

1. Crear un proyecto en [supabase.com](https://supabase.com) — el plan gratuito permite 2
   proyectos activos; si llegaste al límite, pausá uno o subí de plan.
2. Aplicar las migraciones (en orden) desde el SQL Editor o con `supabase db push`.
3. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Settings → API), y poner `VITE_DEMO_MODE=false`.
4. Edge functions en `supabase/functions/`: `create-video-room` (Daily.co),
   `mercadopago-webhook` (pagos) y `send-reminders` (recordatorios por email con Resend).
   Deploy: `supabase functions deploy <nombre>`. Requieren secrets: `DAILY_API_KEY`,
   `MP_ACCESS_TOKEN`, `RESEND_API_KEY`.

## 🧱 Stack

React 19 · Vite · TypeScript · Tailwind v4 · React Router 7 · TanStack Query ·
react-hook-form + zod · framer-motion · Supabase (Postgres + Auth + Storage + Edge Functions)

## 📐 Decisiones de diseño clave

- **Anti doble-reserva a nivel de BD**: constraint de exclusión GiST sobre
  `appointments(lawyer_id, tstzrange)` — imposible solapar turnos, incluso con concurrencia.
- **Slots calculados en SQL** (`get_available_slots`): una sola fuente de verdad de
  disponibilidad. El cliente tiene una réplica en `src/lib/slots.ts` para el modo demo.
- **Webhook de pagos idempotente**: `payments.gateway_payment_id` es UNIQUE.
- **RLS en todas las tablas**: el cliente jamás ve `lawyer_notes`; cada parte solo ve lo suyo.
- **Modo demo** como feature de producto: sirve para demos de venta y desarrollo sin backend.

## 📄 Documentación

- Diseño completo: [docs/superpowers/specs/2026-06-09-legalhub-design.md](docs/superpowers/specs/2026-06-09-legalhub-design.md)
- Roadmap por fases: Fase 1 (MVP actual) → Fase 2 (Supabase + MercadoPago + Daily.co real) →
  Fase 3 (marketing kit, blog, PWA, pt-BR) → Fase 4 (IA, facturación electrónica DGI/AFIP).
