# LegalHub — Diseño técnico y de producto

**Fecha:** 2026-06-09 · **Estado:** Aprobado por spec del usuario (el usuario entregó la spec completa y pidió construcción autónoma con mejoras a criterio).

## 1. Qué es

Plataforma SaaS para abogados, escribanos y notarios en LATAM (foco UY/AR): perfil profesional verificado, agenda online, cobro de consultas, videollamada integrada y sistema de reputación. Equivalente a Encuadrado.com especializado en el sector legal.

## 2. Decisiones clave (mejoras sobre la spec original)

1. **Modo demo integrado** (`VITE_DEMO_MODE=true`): la app funciona completa con datos seed locales sin backend. Motivos: (a) el plan gratuito de Supabase del usuario está al límite de 2 proyectos, (b) sirve como demo de ventas permanente. La capa de datos (`src/api/*`) expone la misma interfaz con dos implementaciones: demo (in-memory + localStorage) y Supabase.
2. **Anti doble-reserva a nivel de BD**: constraint de exclusión (`btree_gist`) sobre `appointments(lawyer_id, tstzrange(starts_at, ends_at))` — la concurrencia no puede generar turnos superpuestos, sin importar bugs del cliente.
3. **Slots calculados en SQL** (`get_available_slots`): una sola fuente de verdad para disponibilidad (horarios semanales − bloqueos − turnos existentes − anticipación mín/máx). El front solo pinta.
4. **WhatsApp por deep-links en MVP** (gratis, sin API): recordatorios automáticos por email (Resend); WhatsApp Business API queda para Fase 3 (tiene costo y aprobación de Meta).
5. **Pagos como máquina de estados** con webhook idempotente (`gateway_payment_id` único). En demo, el checkout simula la pasarela. La integración MercadoPago es una edge function aislada.
6. **Terminología por país**: helper i18n (`escribano` UY ↔ `notario` AR/resto). Estructura `src/i18n/` lista para i18next completo en Fase 3.
7. **Perfiles + roles en tabla `profiles`** espejo de `auth.users` con trigger, en lugar de metadata suelta — RLS más simple y consultable.

## 3. Stack

React 19 + Vite + TypeScript + Tailwind v4 (CSS-first) + React Router 7 + TanStack Query + react-hook-form/zod + framer-motion + lucide-react. Backend: Supabase (Postgres 17, Auth, Storage, Edge Functions). Pagos: MercadoPago (+ PayPal F2). Video: Daily.co (F2). Email: Resend.

**Identidad visual** ("Legal Premium"): navy `#1A2B4B`, dorado `#C9A96E`, crema `#F8F7F4`, verde `#2D7A4F`. Display: Cormorant Garamond; UI: DM Sans; números: JetBrains Mono (via @fontsource, offline).

## 4. Descomposición en fases

- **Fase 1 (esta entrega — MVP navegable):** landing, directorio con filtros, perfil público, wizard de agendamiento con checkout simulado, auth (cliente + profesional con onboarding), dashboard profesional (agenda, servicios, disponibilidad, clientes, reseñas, estadísticas), precios, esquema SQL completo con RLS, edge functions escritas, modo demo con 12 profesionales seed.
- **Fase 2:** conectar Supabase real (auth, datos), MercadoPago real, Daily.co, Resend, verificación de matrícula con panel admin.
- **Fase 3:** kit de marketing, blog profesional, i18n completo (pt-BR), PWA, plan Estudio multi-perfil, destacados.
- **Fase 4:** IA (asistente de bio, análisis de reviews, chatbot orientador), facturación electrónica DGI/AFIP, API pública.

## 5. Arquitectura del frontend

```
src/
  main.tsx, App.tsx            — router + providers (QueryClient, AuthContext)
  styles/index.css             — theme Tailwind v4 (@theme tokens de marca)
  lib/                         — supabase client, utils (cn, formato moneda/fecha), demo flag
  i18n/                        — strings es-UY + terminología por país
  types/                       — tipos de dominio (Lawyer, Service, Appointment, Review…)
  data/demo/                   — seed: 12 profesionales, servicios, reviews, turnos
  api/                         — lawyers / appointments / reviews / auth (switch demo↔supabase)
  components/ui/               — Button, Card, Badge, Input, Select, Modal, Rating, Avatar, Chip…
  components/layout/           — Header, Footer, DashboardLayout (sidebar)
  pages/                       — una página por ruta, componen features
  features/booking/            — wizard multi-paso con SlotPicker
```

**Rutas:** `/` · `/abogados` (directorio) · `/escribanos` · `/p/:slug` · `/p/:slug/agendar` · `/precios` · `/login` · `/registro` · `/registro/profesional` · `/dashboard/{agenda,servicios,disponibilidad,clientes,resenas,estadisticas,configuracion}` · `/mi-cuenta`.

**Flujo de agendamiento (cliente):** servicio → día/hora (slots) → datos + nota → política de cancelación + pago → confirmación con CTA a WhatsApp/calendario. Estado del wizard en un reducer local; al confirmar se crea appointment `pending_payment` → pago → `confirmed`.

## 6. Modelo de datos (resumen — ver supabase/migrations)

`profiles` (rol) · `lawyers` (perfil, plan, verificación) · `services` · `availability` (semanal) · `time_blocks` · `clients` · `appointments` (estados: `pending_payment → confirmed → completed | cancelled | no_show`) · `payments` · `reviews` (1:1 con appointment, gated a consulta completada) · `documents` · `articles` · `messages` · `subscriptions`. RLS: perfiles/servicios públicos de lectura; turnos visibles solo para su abogado y su cliente; `lawyer_notes` excluido del cliente vía vista; escrituras solo del dueño.

## 7. Manejo de errores y testing

- Validación de formularios con zod en el borde; estados de carga/vacío/error explícitos en cada página con React Query.
- La lógica de slots (generación, solapamiento, anticipación) vive en `lib/slots.ts` puro y testeable; la versión SQL es la autoridad en producción.
- Verificación de la entrega: `tsc -b && vite build` verde + recorrido visual de las rutas principales.

## 8. Modelo de negocio (sin cambios sobre la spec)

Planes Gratuito $0 (5% comisión, 10 turnos/mes) · Esencial $9 · Profesional $19 (recomendado, videollamada) · Estudio $39 (5 perfiles) · Enterprise. Ingresos extra: destacados $15/mes, storage, IA por uso.
