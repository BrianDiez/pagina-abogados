-- LegalHub — Estudios jurídicos (modelo LinkedIn)
-- Regla de notificación del producto:
--   * appointments (reservas al perfil individual) -> notifican SOLO al profesional.
--   * firm_inquiries (consultas a la página del estudio) -> notifican al estudio
--     (todos los miembros + email del estudio via edge function).

create table public.firms (
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
  founded_year integer check (founded_year between 1900 and 2100),
  specialties text[] not null default '{}',
  owner_lawyer_id uuid not null references public.lawyers(id),
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger firms_updated_at before update on public.firms
  for each row execute function public.set_updated_at();

create table public.firm_members (
  firm_id uuid not null references public.firms(id) on delete cascade,
  lawyer_id uuid not null references public.lawyers(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (firm_id, lawyer_id),
  -- un profesional pertenece a un solo estudio
  constraint one_firm_per_lawyer unique (lawyer_id)
);

-- Límite del plan Estudio: hasta 5 miembros (Enterprise lo levanta vía claim)
create or replace function public.check_firm_member_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.firm_members where firm_id = new.firm_id) >= 5 then
    raise exception 'El plan Estudio incluye hasta 5 perfiles';
  end if;
  return new;
end;
$$;

create trigger firm_members_limit before insert on public.firm_members
  for each row execute function public.check_firm_member_limit();

create table public.firm_inquiries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  specialty text,
  message text not null check (char_length(message) <= 800),
  is_read boolean not null default false,
  read_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index firm_inquiries_firm_idx on public.firm_inquiries (firm_id, is_read, created_at desc);

-- ── RLS ──
alter table public.firms enable row level security;
alter table public.firm_members enable row level security;
alter table public.firm_inquiries enable row level security;

create or replace function public.is_firm_member(p_firm_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.firm_members fm
    join public.lawyers l on l.id = fm.lawyer_id
    where fm.firm_id = p_firm_id and l.user_id = auth.uid()
  );
$$;

create or replace function public.is_firm_owner(p_firm_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.firms f
    join public.lawyers l on l.id = f.owner_lawyer_id
    where f.id = p_firm_id and l.user_id = auth.uid()
  );
$$;

-- firms: lectura pública (directorio); crea cualquier profesional; edita el dueño
create policy "firms_public_read" on public.firms
  for select using (is_active or public.is_firm_member(id) or public.is_admin());
create policy "firms_lawyer_create" on public.firms
  for insert with check (
    exists (select 1 from public.lawyers l where l.id = owner_lawyer_id and l.user_id = auth.uid())
  );
create policy "firms_owner_update" on public.firms
  for update using (public.is_firm_owner(id) or public.is_admin());

-- firm_members: lectura pública (el equipo es visible); administra el dueño
create policy "firm_members_public_read" on public.firm_members
  for select using (true);
create policy "firm_members_owner_write" on public.firm_members
  for insert with check (public.is_firm_owner(firm_id));
create policy "firm_members_owner_delete" on public.firm_members
  for delete using (public.is_firm_owner(firm_id));

-- firm_inquiries: crea cualquiera (anónimo incluido); leen SOLO los miembros del estudio.
-- Nota deliberada: las reservas individuales (appointments) NO tienen política para
-- el estudio — la privacidad del perfil individual es una regla de producto.
create policy "firm_inquiries_anyone_create" on public.firm_inquiries
  for insert with check (true);
create policy "firm_inquiries_members_read" on public.firm_inquiries
  for select using (public.is_firm_member(firm_id) or public.is_admin());
create policy "firm_inquiries_members_update" on public.firm_inquiries
  for update using (public.is_firm_member(firm_id));

-- Fase 2: trigger/webhook -> edge function notify-firm-inquiry (Resend al email
-- del estudio + miembros). Ver supabase/functions/.
