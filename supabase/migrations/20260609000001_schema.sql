-- LegalHub — Esquema inicial
-- Postgres 17 / Supabase. Aplicar con: supabase db push  (o via MCP apply_migration)

create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────
-- Perfiles espejo de auth.users con rol
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('lawyer', 'client', 'admin')),
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Profesionales
-- ─────────────────────────────────────────────────────────────
create table public.lawyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  slug text unique not null,
  display_name text not null,
  title text, -- 'Dr.', 'Dra.', 'Esc.'
  professional_type text not null default 'lawyer'
    check (professional_type in ('lawyer', 'notary', 'tax_advisor', 'other')),
  bio text check (char_length(bio) <= 800),
  photo_url text,
  video_url text,
  years_experience integer check (years_experience between 0 and 70),
  matricula_number text,
  is_verified boolean not null default false,
  verification_status text not null default 'unsubmitted'
    check (verification_status in ('unsubmitted', 'pending', 'verified', 'rejected')),
  verification_notes text,
  country text not null default 'UY',
  city text,
  address text,
  phone text,
  whatsapp text,
  linkedin_url text,
  languages text[] not null default '{es}',
  specialties text[] not null default '{}',
  modalities text[] not null default '{video}', -- in_person | video | phone | async
  highlights text[] not null default '{}', -- logros/formación (máx 5, validado en app)
  plan text not null default 'free'
    check (plan in ('free', 'essential', 'professional', 'studio', 'enterprise')),
  plan_expires_at timestamptz,
  mercadopago_user_id text,
  accepts_new_clients boolean not null default true,
  cancellation_policy_hours integer not null default 24,
  cancellation_late_fee_pct integer not null default 50
    check (cancellation_late_fee_pct between 0 and 100),
  is_active boolean not null default true,
  profile_views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lawyers_specialties_idx on public.lawyers using gin (specialties);
create index lawyers_city_idx on public.lawyers (country, city);
create index lawyers_active_idx on public.lawyers (is_active) where is_active;

-- ─────────────────────────────────────────────────────────────
-- Servicios
-- ─────────────────────────────────────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
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
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index services_lawyer_idx on public.services (lawyer_id) where is_active;

-- ─────────────────────────────────────────────────────────────
-- Disponibilidad semanal y bloqueos
-- ─────────────────────────────────────────────────────────────
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade, -- null = aplica a todos
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  check (start_time < end_time)
);

create index availability_lawyer_idx on public.availability (lawyer_id, day_of_week);

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (start_at < end_at)
);

create index time_blocks_lawyer_idx on public.time_blocks (lawyer_id, start_at);

-- ─────────────────────────────────────────────────────────────
-- Clientes
-- ─────────────────────────────────────────────────────────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  country text,
  created_at timestamptz not null default now()
);

create index clients_user_idx on public.clients (user_id);
create index clients_email_idx on public.clients (email);

-- ─────────────────────────────────────────────────────────────
-- Turnos — con exclusión anti doble-reserva
-- ─────────────────────────────────────────────────────────────
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id),
  client_id uuid not null references public.clients(id),
  service_id uuid not null references public.services(id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  modality text not null default 'video',
  client_notes text check (char_length(client_notes) <= 600),
  lawyer_notes text, -- privado del profesional (RLS + vista pública sin esta columna)
  video_room_url text,
  video_room_id text,
  recording_url text,
  price numeric(10,2) not null,
  currency text not null,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded', 'partial_refund', 'waived')),
  cancelled_by text check (cancelled_by in ('lawyer', 'client', 'admin')),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  -- Dos turnos activos del mismo profesional nunca pueden solaparse,
  -- sin importar condiciones de carrera en el cliente.
  constraint no_overlapping_appointments exclude using gist (
    lawyer_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending_payment', 'confirmed'))
);

create index appointments_lawyer_time_idx on public.appointments (lawyer_id, starts_at);
create index appointments_client_idx on public.appointments (client_id, starts_at);

-- ─────────────────────────────────────────────────────────────
-- Pagos
-- ─────────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id),
  lawyer_id uuid not null references public.lawyers(id),
  client_id uuid references public.clients(id),
  amount numeric(10,2) not null,
  currency text not null,
  gateway text not null check (gateway in ('mercadopago', 'paypal', 'manual', 'demo')),
  gateway_payment_id text unique, -- idempotencia de webhooks
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  platform_fee numeric(10,2) not null default 0,
  net_amount numeric(10,2),
  created_at timestamptz not null default now()
);

create index payments_lawyer_idx on public.payments (lawyer_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Reviews — solo de consultas completadas (validado por trigger)
-- ─────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id),
  client_id uuid not null references public.clients(id),
  appointment_id uuid not null unique references public.appointments(id),
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
  is_flagged boolean not null default false,
  lawyer_response text,
  created_at timestamptz not null default now()
);

create index reviews_lawyer_idx on public.reviews (lawyer_id, created_at desc) where is_published;

create or replace function public.validate_review()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  appt record;
begin
  select status, client_id, lawyer_id, starts_at into appt
  from public.appointments where id = new.appointment_id;

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

create trigger reviews_validate before insert on public.reviews
  for each row execute function public.validate_review();

-- ─────────────────────────────────────────────────────────────
-- Documentos, artículos, mensajes, suscripciones
-- ─────────────────────────────────────────────────────────────
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id),
  client_id uuid references public.clients(id),
  appointment_id uuid references public.appointments(id),
  name text not null,
  storage_path text not null,
  file_size integer,
  file_type text,
  is_shared_with_client boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  excerpt text,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (lawyer_id, slug)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id),
  sender_id uuid not null references auth.users(id),
  receiver_id uuid not null references auth.users(id),
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_receiver_idx on public.messages (receiver_id, is_read);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
  plan text not null,
  billing_period text check (billing_period in ('monthly', 'annual')),
  amount numeric(10,2),
  currency text,
  status text not null default 'active'
    check (status in ('trialing', 'active', 'cancelled', 'past_due')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  gateway_subscription_id text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lawyers_updated_at before update on public.lawyers
  for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
