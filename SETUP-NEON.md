# Conectar el backend real: Neon + Clerk + R2 + Cloudflare Pages (todo free tier)

La app corre en modo demo por defecto. Backend real: base Neon, auth Clerk,
archivos R2 y hosting + API en **Cloudflare Pages** (la API vive en `functions/`
como Pages Functions — el driver de Neon está optimizado para Workers).

## 1. Neon (base de datos Postgres) — neon.com  ✅ HECHO

Proyecto creado y `neon/migrations/0001_init.sql` aplicado (16 tablas,
función de slots y valores judiciales verificados el 2026-06-10).
El connection string es la env var `DATABASE_URL`.

## 2. Clerk (autenticación) — dashboard.clerk.com

App ya creada (`app_3Ey88njFB45N3cOd4cSUGEp468J`). Solo falta copiar de
**Configure → API Keys**:
- `Publishable key` (pk_...) → `VITE_CLERK_PUBLISHABLE_KEY`
- `Secret key` (sk_...) → `CLERK_SECRET_KEY`

> No hace falta el Clerk CLI ni `clerk init`: la integración ya está hecha a
> mano (`src/api/clerkAuth.tsx` + verificación de JWT en `server/auth.ts`).

## 3. Cloudflare R2 (archivos) — dash.cloudflare.com

1. R2 → **Create bucket** → nombre `legalhub`.
2. **Manage R2 API Tokens** → Create token (Object Read & Write) →
   `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`. El Account ID está en la URL
   del dashboard → `R2_ACCOUNT_ID`.
3. Bucket → Settings → **Public access** (r2.dev o dominio) → `R2_PUBLIC_URL`.

## 4. Cloudflare Pages (hosting + API) — misma cuenta que R2

1. Workers & Pages → **Create application → Pages → Connect to Git** →
   elegir `BrianDiez/pagina-abogados`.
2. Build settings:
   - Framework preset: **None** (o Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Environment variables** (Production):

   | Variable | Valor |
   |---|---|
   | `VITE_BACKEND` | `neon` |
   | `VITE_CLERK_PUBLISHABLE_KEY` | pk_... (paso 2) |
   | `DATABASE_URL` | connection string de Neon |
   | `CLERK_SECRET_KEY` | sk_... (paso 2) |
   | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | paso 3 |
   | `R2_BUCKET` | `legalhub` |
   | `R2_PUBLIC_URL` | URL pública del bucket |

4. **Save and Deploy**. La carpeta `functions/` se publica sola como Pages
   Functions (rutas `/api/*`); `public/_redirects` maneja el fallback SPA.
5. En Clerk: Configure → Domains → agregar el dominio `*.pages.dev` que te dio
   Cloudflare (y el dominio propio cuando lo tengas).

## 5. Probar

- `/abogados` → directorio desde Neon (vacío hasta que se registren
  profesionales; podés insertar datos de prueba con el SQL Editor de Neon).
- Registrarse como profesional → cuenta Clerk → formulario de perfil →
  fila en `lawyers` → configurar servicios y horarios desde el panel.
- Reservar un turno → fila en `appointments` con anti doble-reserva activo.

## Qué cubre cada modo hoy

| Flujo | demo | neon |
|---|---|---|
| Directorio, perfil público, slots, reserva | ✅ | ✅ (API + Postgres real) |
| Login / registro de cliente | ✅ simulado | ✅ Clerk (SignIn/SignUp) |
| Registro de profesional + onboarding | ✅ | ✅ Clerk + `POST /api/me` |
| Panel: agenda, servicios, disponibilidad, perfil, clientes, stats | ✅ | ✅ `/api/me/*` |
| Reviews (escribir + responder) | ✅ | ✅ `/api/reviews` |
| Estudios: directorio, perfil, contacto, bandeja | ✅ | ✅ |
| Estudios: crear/editar/miembros | ✅ | 🔜 (solo demo por ahora) |
| Pagos | simulado | gateway `demo` — 🔜 MercadoPago split (lógica lista en `supabase/functions/create-payment-preference`, portar a `functions/`) |
| Emails (confirmaciones, recordatorios) | — | 🔜 Resend (requiere `RESEND_API_KEY`) |
| Subida de archivos | — | ✅ presigned R2 (`functions/api/uploads.ts`) |

## Notas de arquitectura

- **API**: Cloudflare Pages Functions en `functions/api/*` (formato Workers:
  `onRequestGet/Post/...` con `context.env`). Código compartido en `server/`.
- **Autorización**: JWT de Clerk verificado por request (`server/auth.ts`) —
  equivale al RLS de la versión Supabase pero en la capa de aplicación.
- **Anti doble-reserva**: constraint de exclusión GiST en Postgres — dos
  requests simultáneos jamás reservan el mismo horario (el perdedor recibe 409).
- **Límites free**: Cloudflare Pages 100k requests/día y 500 builds/mes;
  Neon ~0,5 GB y cómputo scale-to-zero (primera query tras inactividad ~1s);
  Clerk 10k usuarios activos/mes; R2 10 GB.
- La carpeta `supabase/` queda como implementación alternativa de referencia.
