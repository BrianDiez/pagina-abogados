# LegalHub — Prompt de traspaso (continuar en chat nuevo)

> Copiá todo esto como primer mensaje en el chat nuevo. Resume la idea, lo hecho,
> lo pendiente y los detalles técnicos para retomar sin perder contexto.

---

Estoy construyendo **LegalHub**, una plataforma SaaS para **abogados, escribanos y
notarios en LATAM (Uruguay y Argentina)** — el equivalente a Encuadrado.com pero
especializado en el sector legal. El público objetivo es ~70% juniors/recién
matriculados. Ya hay muchísimo hecho y está **en producción**. Necesito que
sigas desde acá. Sé honesto sobre lo que funciona y lo que no (en este proyecto
verificamos en navegador real, no solo build).

## Repo y stack
- **Repo:** https://github.com/BrianDiez/pagina-abogados (branch `main`)
- **Carpeta local:** `C:\Users\brian\OneDrive\Escritorio\Pagina de abogados` (Windows, PowerShell)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind v4 + React Router 7 + TanStack Query + react-hook-form/zod + framer-motion + lucide-react
- **Backend:** Cloudflare Pages Functions (`functions/api/*`), código compartido en `server/`
- **Base de datos:** Neon (Postgres serverless, región São Paulo)
- **Auth:** Clerk · **Storage:** Cloudflare R2 · **Hosting:** Cloudflare Pages
- **URL en producción:** https://localhub-5am.pages.dev (proyecto Cloudflare "localhub-5am", deploy automático en cada push a main)
- **Dos modos:** `VITE_BACKEND=demo` (datos seed en localStorage, sin backend) o `neon` (real). Producción corre en `neon`. El `.env` local está gitignored; Cloudflare tiene sus propias env vars.

## Estado de la infraestructura (todo cargado y verificado vía /api/health)
- Neon, Clerk (instancia test), R2 y las 9 env vars están configuradas en Cloudflare y funcionando.
- Las migraciones viven en `neon/migrations/0001_init.sql` (fuente de verdad del stack vivo). La carpeta `supabase/` es solo implementación de referencia (no se usa).

## Lo que YA está hecho y vivo
- Landing, **directorio** con filtros (rama / departamento-provincia / modalidad), **perfiles públicos**, **precios**.
- **Wizard de reserva** (servicio → horario → datos → pago → confirmación) con **anti doble-reserva** (constraint de exclusión en Postgres) y **slots calculados en SQL**.
- **Auth real con Clerk** (SignIn/SignUp), registro de cliente y de profesional con onboarding en pasos.
- **Panel del profesional:** agenda, servicios (CRUD), disponibilidad, clientes, reseñas, estadísticas, configuración, "Mi estudio".
- **Estudios jurídicos** (modelo LinkedIn): página pública `/e/:slug`, afiliación visible en el perfil individual, **bandeja compartida de consultas**. Regla clave: consultas al estudio → bandeja del estudio; reservas del perfil individual → privadas del profesional.
- **Features junior-first:** precio sugerido por experiencia/país, primera consulta gratis, checklist de onboarding, plantilla de bio.
- **Mobile-first:** CTA fija, bottom nav, PWA instalable.
- **SEO:** títulos/OG/canonical por página, JSON-LD (Attorney/LegalService/FAQ), robots + sitemap.
- **Calculadora de valores judiciales** `/valores`: UR, BPC (UY), UMA (AR) con fuentes oficiales + edge function de actualización.
- **Geografía de dos niveles:** 19 departamentos de UY + 24 provincias de AR → ciudad filtrada (ciudad opcional, región obligatoria).
- **Multi-matrícula por jurisdicción** (CPACF, federal, colegios provinciales / SCJ-CAU-AEU en UY), con sugerencia del colegio local según la provincia. UX de filas con dropdown + "Agregar matrícula".
- **Taxonomía de 28 ramas del derecho** con sus temas (validada con una abogada real), UX de dropdown + "Agregar rama" (no chips). "Divorcio" es tema de Familia, "inmobiliario" tema de Civil, etc.
- **Posgrados/especializaciones** en el registro.
- **Modelo de negocio documentado** (`docs/business-model.md`): plan Gratuito $0 + 5% comisión, Esencial $9, Profesional $19, Estudio $49. Cobro en moneda local.
- **MercadoPago (código completo, fallback-safe):** OAuth connect, split de pagos (5% solo plan free vía marketplace_fee), webhook idempotente, pantalla `/reserva/:id` de retorno. Endpoints en `functions/api/mp/*` y `functions/api/payments/create.ts`.
- **Videollamadas REALES:** por defecto **Jitsi Meet** (gratis, sin setup, navegador+móvil); opcional **Daily.co** si se carga `DAILY_API_KEY`. Cada turno video confirmado recibe sala real (`server/video.ts`).
- **Error Boundary global** (muestra el error en vez de pantalla blanca).

## Lo que FALTA / pendiente de acción del usuario (yo, Brian)
1. **Clerk — 2 toggles en el dashboard (BLOQUEA el registro real):**
   - Organizations → **desactivar** "Enable Organizations" (causa pantalla blanca en `#/tasks/choose-organization`).
   - Configure → Email/Phone/Username → **Username = Off** (Google pide username).
2. **MercadoPago — crear la app** (para cobrar de verdad): mercadopago.com.uy/developers → app modelo **Marketplace**, Redirect URI `https://localhub-5am.pages.dev/api/mp/callback`. Cargar en Cloudflare: `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `APP_URL=https://localhub-5am.pages.dev`. Probar en **sandbox** primero. (Guía: `SETUP-MERCADOPAGO.md`.)
3. **Emails (Resend) — NO construido aún:** confirmaciones de reserva, recordatorios 24h/2h, post-consulta para reseña. La lógica existe en `supabase/functions/send-reminders` pero **no está portada** a Cloudflare. Necesita `RESEND_API_KEY`.
4. **Daily.co (opcional):** `DAILY_API_KEY` para salas privadas con ventana horaria + grabación (Jitsi ya funciona sin esto).
5. **Refresh del token de MercadoPago** (expira ~180 días) — no implementado.
6. **Gestión de estudios vía API** (crear/editar/miembros) — solo funciona en modo demo, falta portar a neon (endpoints `functions/api/firms/*` para escritura).
7. **Dominio propio** — hoy es `localhub-5am.pages.dev`.

## Gotchas importantes para la próxima sesión
- **Cloudflare sirve los chunks dinámicos de Vite (`import()` / `React.lazy`) con Content-Type `text/html`** → el navegador rechaza el módulo ES → pantalla blanca. Por eso Clerk se importa **estático**. **Evitá `React.lazy`/dynamic imports** salvo que arregles el MIME con un `public/_headers`. Esto ya nos mordió una vez.
- El **demo DB en localStorage** tiene una key versionada (hoy `legalhub-demo-db-v6`); subila cuando cambie el esquema de seeds.
- **Deploys Cloudflare free:** tardan 2-7 min y a veces encolan. Verificá comparando el hash del bundle (`assets/index-XXXX.js`) en la home.
- **Build:** `npm run build` (modo según `.env`). Typecheck de functions: `npx tsc -p tsconfig.functions.json`.
- En git aparecen warnings de `LF will be replaced by CRLF` — normal en Windows, ignorar.
- **La novia de Brian es abogada** y es la experta de dominio que revisa taxonomía/jurisdicciones. Su feedback maneja esas decisiones.
- Endpoint **`/api/health`** devuelve estado de env vars + conexión a la base (diagnóstico sin exponer valores).

## Tablas en Neon (producción)
`users`, `lawyers` (con `province`, `registrations` jsonb, `specialties`, `topics`, `highlights`, `video_room_url`), `services`, `availability`, `time_blocks`, `clients`, `appointments` (constraint anti-solapamiento, `video_room_url`), `payments` (`gateway_payment_id` UNIQUE para idempotencia), `reviews`, `firms`, `firm_members`, `firm_inquiries`, `mp_credentials`, `legal_units`, `legal_unit_history`.

## Cómo seguir
Cuando empiece el chat nuevo, mi prioridad probable es: (a) que termine los 2 toggles de Clerk para desbloquear el registro, (b) construir los **emails con Resend**, (c) crear la app de **MercadoPago** y probar el cobro en sandbox de punta a punta. Preguntame por dónde quiero arrancar y verificá siempre en el navegador real (no solo build) antes de decir que algo funciona.
