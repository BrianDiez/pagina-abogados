# Conectar el backend real: Neon + Clerk + R2 (todo free tier)

La app corre en modo demo por defecto. Para activar el backend real seguí estos
pasos (15-20 minutos, no se necesita tarjeta en ninguno).

## 1. Neon (base de datos Postgres) — neon.com

1. Crear cuenta → **New Project** → nombre `legalhub`, región AWS São Paulo si está disponible.
2. Copiar el **connection string** (pooled) de Connection Details.
3. Aplicar el esquema:
   ```bash
   psql "postgresql://...tu-connection-string..." -f neon/migrations/0001_init.sql
   ```
   (Sin psql local: pegá el contenido del archivo en el **SQL Editor** del dashboard de Neon.)

## 2. Clerk (autenticación) — clerk.com

1. Crear cuenta → **Create application** → nombre `LegalHub`, habilitar Email + Google.
2. De **API Keys** copiar:
   - `Publishable key` → `VITE_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`

## 3. Cloudflare R2 (archivos: fotos, documentos) — dash.cloudflare.com

1. R2 → **Create bucket** → nombre `legalhub`.
2. **Manage R2 API Tokens** → Create token (Object Read & Write) → copiar
   `Access Key ID` y `Secret Access Key`. El Account ID está en la URL del dashboard.
3. En el bucket: Settings → **Public access** → habilitar r2.dev o dominio propio
   → esa URL es `R2_PUBLIC_URL`.

## 4. Vercel (hosting + API) — vercel.com

1. **Import** del repo `BrianDiez/pagina-abogados` (framework: Vite, todo default).
2. En Settings → Environment Variables cargar TODAS las de `.env.example`
   (con `VITE_BACKEND=neon`).
3. Deploy. Las funciones de `api/` se publican solas como serverless functions.

## 5. Probar

- `https://tu-app.vercel.app/abogados` → directorio desde Neon (vacío hasta cargar
  profesionales: registrate y completá el perfil, o insertá datos de prueba con
  el SQL Editor).
- Reservar un turno → fila en `appointments` con el constraint anti doble-reserva activo.

## Qué cubre cada modo hoy

| Flujo | demo | neon |
|---|---|---|
| Directorio, perfil público, slots, reserva, pago-demo | ✅ | ✅ (API + Postgres real) |
| Login/registro | ✅ simulado | ✅ Clerk (provider montado) |
| Panel del profesional (agenda, servicios, etc.) | ✅ | 🔜 próxima etapa: endpoints `/api/me/*` siguiendo el patrón de `api/me.ts` |
| Reviews escribir / estudios gestionar | ✅ | 🔜 misma etapa |
| Pagos MercadoPago split | — | 🔜 portar `supabase/functions/create-payment-preference` a `api/` (la lógica ya está escrita) |
| Subida de archivos | — | ✅ presigned R2 (`api/uploads.ts`) |

## Notas de arquitectura

- **Autorización**: la API verifica el JWT de Clerk en cada request
  (`api/_lib/auth.ts`) — equivale al RLS de la versión Supabase pero en la capa
  de aplicación. El esquema RLS original queda en `supabase/migrations/` como
  referencia si algún día se vuelve a Supabase/self-host.
- **Anti doble-reserva**: vive en Postgres (constraint de exclusión GiST), no en
  el código — funciona igual en Neon.
- **Límites free**: Neon ~0,5 GB/proyecto y cómputo que escala a cero (la primera
  query tras inactividad tarda ~1s extra); Clerk 10k usuarios activos/mes;
  R2 10 GB. Suficiente para validar y para los primeros cientos de profesionales.
