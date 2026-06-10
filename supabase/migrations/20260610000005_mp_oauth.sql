-- LegalHub — Credenciales OAuth de MercadoPago por profesional
-- Flujo: el profesional hace "Conectar MercadoPago" en su panel →
-- authorization_code flow → guardamos sus tokens acá. Las preferencias de pago
-- se crean con SU access_token + marketplace_fee (split de pagos):
-- la comisión del 5% (solo plan free) se separa automáticamente en cada cobro.

create table public.mp_credentials (
  lawyer_id uuid primary key references public.lawyers(id) on delete cascade,
  mp_user_id text not null,
  access_token text not null,   -- cifrar con Vault en producción
  refresh_token text not null,
  public_key text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger mp_credentials_updated_at before update on public.mp_credentials
  for each row execute function public.set_updated_at();

-- Sin políticas de lectura/escritura para clientes: SOLO service_role accede
-- (los tokens jamás viajan al navegador). El profesional ve únicamente el
-- estado "conectado/no conectado" vía una vista segura.
alter table public.mp_credentials enable row level security;

create view public.mp_connection_status
with (security_invoker = false) as
  select lawyer_id, connected_at, (expires_at > now()) as token_valid
  from public.mp_credentials;

grant select on public.mp_connection_status to authenticated;

-- Nota de facturación de suscripciones (decisión 2026-06-10):
-- Las suscripciones de planes se cobran via MP Suscripciones EN MONEDA LOCAL
-- (UYU/ARS), nunca en USD: los mínimos locales quedan muy por debajo de
-- cualquier plan. Si un mínimo local superara al plan Esencial mensual,
-- el fallback es frecuencia trimestral (MP soporta weekly..annual).
