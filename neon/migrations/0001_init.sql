-- LegalHub — Esquema para NEON (Postgres serverless)
-- Diferencias vs. la versión Supabase (supabase/migrations/):
--   * No existe el esquema auth: la identidad la maneja CLERK. Los usuarios se
--     referencian por clerk_user_id (text) en la tabla users.
--   * Sin RLS/auth.uid(): la autorización vive en la capa API (api/ en Vercel),
--     que verifica el token de Clerk en cada request. (RLS con Neon+Clerk JWT
--     puede agregarse después como defensa en profundidad.)
-- Aplicar con:  psql $DATABASE_URL -f neon/migrations/0001_init.sql

create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────
-- Usuarios (espejo mínimo de Clerk) y perfiles
-- ─────────────────────────────────────────────────────────────
create table users (
  id text primary key, -- clerk_user_id (user_2abc...)
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('lawyer', 'client', 'admin')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Profesionales
-- ─────────────────────────────────────────────────────────────
create table lawyers (
  id uuid primary key default gen_random_uuid(),
  user_id text unique references users(id) on delete cascade,
  slug text unique not null,
  display_name text not null,
  title text,
  professional_type text not null default 'lawyer'
    check (professional_type in ('lawyer', 'notary', 'tax_advisor', 'other')),
  bio text check (char_length(bio) <= 800),
  photo_url text,
  video_url text,
  years_experience integer check (years_experience between 0 and 70),
  matricula_number text, -- string visible compuesto ("CPACF T°89 F°412 · Fed. …")
  -- matrículas por jurisdicción [{jurisdictionId, number}] — en AR suele haber varias
  -- (CPACF, federal, colegios provinciales); ver src/lib/jurisdictions.ts
  registrations jsonb not null default '[]'::jsonb,
  is_verified boolean not null default false,
  verification_status text not null default 'unsubmitted'
    check (verification_status in ('unsubmitted', 'pending', 'verified', 'rejected')),
  country text not null default 'UY',
  province text, -- departamento (UY) o provincia (AR)
  city text,
  phone text,
  whatsapp text,
  linkedin_url text,
  languages text[] not null default '{es}',
  specialties text[] not null default '{}', -- ramas del derecho (LEGAL_AREAS)
  topics text[] not null default '{}', -- temas opcionales dentro de las ramas
  modalities text[] not null default '{video}',
  highlights text[] not null default '{}', -- formación / posgrados
  plan text not null default 'free'
    check (plan in ('free', 'essential', 'professional', 'studio', 'enterprise')),
  accepts_new_clients boolean not null default true,
  cancellation_policy_hours integer not null default 24,
  cancellation_late_fee_pct integer not null default 50
    check (cancellation_late_fee_pct between 0 and 100),
  is_active boolean not null default true,
  profile_views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lawyers_specialties_idx on lawyers using gin (specialties);
create index lawyers_city_idx on lawyers (country, city);

-- ─────────────────────────────────────────────────────────────
-- Servicios, disponibilidad, bloqueos
-- ─────────────────────────────────────────────────────────────
create table services (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 45 check (duration_minutes between 10 and 480),
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'UYU' check (currency in ('UYU', 'ARS', 'USD', 'BRL', 'CLP')),
  modality text not null default 'video' check (modality in ('video', 'in_person', 'phone', 'async')),
  is_active boolean not null default true,
  max_advance_days integer not null default 60,
  min_advance_hours integer not null default 2,
  break_after_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  check (start_time < end_time)
);

create table time_blocks (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  check (start_at < end_at)
);

-- ─────────────────────────────────────────────────────────────
-- Clientes y turnos (con anti doble-reserva)
-- ─────────────────────────────────────────────────────────────
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  country text,
  created_at timestamptz not null default now()
);

create index clients_email_idx on clients (email);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id),
  client_id uuid not null references clients(id),
  service_id uuid not null references services(id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  modality text not null default 'video',
  client_notes text check (char_length(client_notes) <= 600),
  lawyer_notes text, -- privado: la API solo lo expone al profesional dueño
  video_room_url text,
  price numeric(10,2) not null,
  currency text not null,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'partial_refund', 'waived')),
  cancelled_by text check (cancelled_by in ('lawyer', 'client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  constraint no_overlapping_appointments exclude using gist (
    lawyer_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending_payment', 'confirmed'))
);

create index appointments_lawyer_time_idx on appointments (lawyer_id, starts_at);
create index appointments_client_idx on appointments (client_id, starts_at);

-- ─────────────────────────────────────────────────────────────
-- Pagos y reviews
-- ─────────────────────────────────────────────────────────────
create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  lawyer_id uuid not null references lawyers(id),
  amount numeric(10,2) not null,
  currency text not null,
  gateway text not null check (gateway in ('mercadopago', 'paypal', 'manual', 'demo')),
  gateway_payment_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  platform_fee numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id),
  client_id uuid not null references clients(id),
  appointment_id uuid not null unique references appointments(id),
  rating_overall integer not null check (rating_overall between 1 and 5),
  rating_clarity integer check (rating_clarity between 1 and 5),
  rating_punctuality integer check (rating_punctuality between 1 and 5),
  rating_knowledge integer check (rating_knowledge between 1 and 5),
  rating_treatment integer check (rating_treatment between 1 and 5),
  text_review text,
  would_recommend boolean,
  is_anonymous boolean not null default false,
  specialty_consulted text,
  is_published boolean not null default true,
  lawyer_response text,
  created_at timestamptz not null default now()
);

create or replace function validate_review()
returns trigger language plpgsql as $$
declare appt record;
begin
  select status, client_id, lawyer_id, starts_at into appt
  from appointments where id = new.appointment_id;
  if appt is null or appt.status <> 'completed' then
    raise exception 'Solo se puede reseñar una consulta completada';
  end if;
  if appt.client_id <> new.client_id or appt.lawyer_id <> new.lawyer_id then
    raise exception 'La reseña no corresponde a esta consulta';
  end if;
  if appt.starts_at < now() - interval '30 days' then
    raise exception 'La ventana de 30 días para reseñar expiró';
  end if;
  return new;
end;
$$;

create trigger reviews_validate before insert on reviews
  for each row execute function validate_review();

-- ─────────────────────────────────────────────────────────────
-- Estudios jurídicos
-- ─────────────────────────────────────────────────────────────
create table firms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text check (char_length(tagline) <= 120),
  description text check (char_length(description) <= 1200),
  logo_url text,
  city text not null,
  country text not null default 'UY',
  email text,
  phone text,
  website_url text,
  linkedin_url text,
  instagram_url text,
  x_url text,
  founded_year integer,
  specialties text[] not null default '{}',
  owner_lawyer_id uuid not null references lawyers(id),
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table firm_members (
  firm_id uuid not null references firms(id) on delete cascade,
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (firm_id, lawyer_id),
  constraint one_firm_per_lawyer unique (lawyer_id)
);

create table firm_inquiries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  specialty text,
  message text not null check (char_length(message) <= 800),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index firm_inquiries_firm_idx on firm_inquiries (firm_id, is_read, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Credenciales MercadoPago (split de pagos) — solo accede la API server-side
-- ─────────────────────────────────────────────────────────────
create table mp_credentials (
  lawyer_id uuid primary key references lawyers(id) on delete cascade,
  mp_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz,
  connected_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Unidades judiciales (UR, BPC, UMA…) + historial
-- ─────────────────────────────────────────────────────────────
create table legal_units (
  id text primary key,
  country text not null check (country in ('UY', 'AR')),
  code text not null,
  name text not null,
  description text,
  value numeric(14,2) not null check (value > 0),
  currency text not null check (currency in ('UYU', 'ARS')),
  valid_from date not null,
  frequency text not null,
  source text not null,
  source_url text not null,
  approximate boolean not null default false,
  updated_at timestamptz not null default now()
);

create table legal_unit_history (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null references legal_units(id),
  value numeric(14,2) not null,
  valid_from date not null,
  recorded_at timestamptz not null default now(),
  unique (unit_id, valid_from)
);

insert into legal_units (id, country, code, name, description, value, currency, valid_from, frequency, source, source_url, approximate) values
  ('uy-ur', 'UY', 'UR', 'Unidad Reajustable', 'Se ajusta mensualmente según el IMS (INE).', 1921.36, 'UYU', '2026-06-01', 'mensual', 'INE / DGI', 'https://www.gub.uy/direccion-general-impositiva/datos-y-estadisticas/datos/unidad-reajustable-ur', false),
  ('uy-bpc', 'UY', 'BPC', 'Base de Prestaciones y Contribuciones', 'Se fija por decreto cada enero.', 6864, 'UYU', '2026-01-01', 'anual', 'Decreto 11/026 — BPS', 'https://www.impo.com.uy/bases/decretos-originales/11-2026', false),
  ('uy-timbre', 'UY', 'Timbre prof.', 'Timbre profesional (escrito judicial)', 'Timbre CJPPU; varias denominaciones según acto.', 250, 'UYU', '2025-01-01', 'semestral', 'CJPPU / DGI', 'https://www.cjppu.org.uy/timbres.php', true),
  ('ar-uma', 'AR', 'UMA', 'Unidad de Medida Arancelaria', 'Ley 27.423 — honorarios justicia nacional y federal.', 89875, 'ARS', '2026-03-05', 'variable (por acordada)', 'CSJN — Res. 235/26', 'https://www.csjn.gov.ar/transparencia/uma', false);

-- ─────────────────────────────────────────────────────────────
-- updated_at + slots + stats (idénticos a la versión Supabase)
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger lawyers_updated_at before update on lawyers
  for each row execute function set_updated_at();
create trigger appointments_updated_at before update on appointments
  for each row execute function set_updated_at();
create trigger firms_updated_at before update on firms
  for each row execute function set_updated_at();

create or replace function get_available_slots(
  p_lawyer_id uuid,
  p_service_id uuid,
  p_from date,
  p_to date,
  p_tz text default 'America/Montevideo'
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable as $$
declare
  svc record;
  d date;
  win record;
  cursor_t timestamptz;
  candidate_end timestamptz;
  not_before timestamptz;
  not_after timestamptz;
begin
  select duration_minutes, break_after_minutes, min_advance_hours, max_advance_days
    into svc from services
  where id = p_service_id and lawyer_id = p_lawyer_id and is_active;
  if svc is null then return; end if;

  not_before := now() + make_interval(hours => svc.min_advance_hours);
  not_after  := now() + make_interval(days => svc.max_advance_days);

  for d in select generate_series(p_from, p_to, interval '1 day')::date loop
    for win in
      select a.start_time, a.end_time from availability a
      where a.lawyer_id = p_lawyer_id and a.is_active
        and a.day_of_week = extract(dow from d)::int
        and (a.service_id is null or a.service_id = p_service_id)
      order by a.start_time
    loop
      cursor_t := (d::text || ' ' || win.start_time::text)::timestamp at time zone p_tz;
      while cursor_t + make_interval(mins => svc.duration_minutes)
            <= (d::text || ' ' || win.end_time::text)::timestamp at time zone p_tz loop
        candidate_end := cursor_t + make_interval(mins => svc.duration_minutes);
        if cursor_t >= not_before and cursor_t <= not_after
          and not exists (
            select 1 from time_blocks tb
            where tb.lawyer_id = p_lawyer_id
              and tstzrange(tb.start_at, tb.end_at) && tstzrange(cursor_t, candidate_end))
          and not exists (
            select 1 from appointments ap
            where ap.lawyer_id = p_lawyer_id
              and ap.status in ('pending_payment', 'confirmed')
              and tstzrange(ap.starts_at, ap.ends_at) && tstzrange(cursor_t, candidate_end))
        then
          slot_start := cursor_t; slot_end := candidate_end; return next;
        end if;
        cursor_t := candidate_end + make_interval(mins => svc.break_after_minutes);
      end loop;
    end loop;
  end loop;
end;
$$;

create or replace view lawyer_stats as
select
  l.id as lawyer_id,
  count(distinct a.id) filter (where a.status = 'completed') as completed_consultations,
  count(distinct r.id) as review_count,
  round(avg(r.rating_overall) filter (where r.is_published), 2) as avg_rating,
  round(100.0 * count(*) filter (where r.would_recommend and r.is_published)
    / nullif(count(r.id) filter (where r.is_published), 0)) as recommend_pct
from lawyers l
left join appointments a on a.lawyer_id = l.id
left join reviews r on r.lawyer_id = l.id
group by l.id;
