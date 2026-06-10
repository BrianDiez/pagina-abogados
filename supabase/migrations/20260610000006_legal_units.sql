-- LegalHub — Unidades y valores judiciales (UR, BPC, timbres, UMA…)
-- Se actualizan por cron (edge function update-legal-units) + override manual de admin.

create table public.legal_units (
  id text primary key, -- 'uy-ur', 'uy-bpc', 'ar-uma'…
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

create trigger legal_units_updated_at before update on public.legal_units
  for each row execute function public.set_updated_at();

-- Historial: cada cambio de valor queda registrado (sirve para liquidaciones retroactivas)
create table public.legal_unit_history (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null references public.legal_units(id),
  value numeric(14,2) not null,
  valid_from date not null,
  recorded_at timestamptz not null default now(),
  unique (unit_id, valid_from)
);

create or replace function public.record_legal_unit_history()
returns trigger language plpgsql as $$
begin
  insert into public.legal_unit_history (unit_id, value, valid_from)
  values (new.id, new.value, new.valid_from)
  on conflict (unit_id, valid_from) do update set value = excluded.value;
  return new;
end;
$$;

create trigger legal_units_history after insert or update of value on public.legal_units
  for each row execute function public.record_legal_unit_history();

-- Lectura pública (la página /valores es abierta y SEO); escribe solo service_role/admin
alter table public.legal_units enable row level security;
alter table public.legal_unit_history enable row level security;

create policy "legal_units_public_read" on public.legal_units for select using (true);
create policy "legal_units_admin_write" on public.legal_units
  for all using (public.is_admin()) with check (public.is_admin());
create policy "legal_unit_history_public_read" on public.legal_unit_history for select using (true);

-- Seed inicial (valores junio 2026 con fuente; ver src/data/legalUnits.ts)
insert into public.legal_units (id, country, code, name, description, value, currency, valid_from, frequency, source, source_url, approximate) values
  ('uy-ur', 'UY', 'UR', 'Unidad Reajustable', 'Se ajusta mensualmente según el Índice Medio de Salarios (INE).', 1921.36, 'UYU', '2026-06-01', 'mensual', 'INE / DGI', 'https://www.gub.uy/direccion-general-impositiva/datos-y-estadisticas/datos/unidad-reajustable-ur', false),
  ('uy-bpc', 'UY', 'BPC', 'Base de Prestaciones y Contribuciones', 'Se fija por decreto cada enero.', 6864, 'UYU', '2026-01-01', 'anual', 'Decreto 11/026 — BPS', 'https://www.impo.com.uy/bases/decretos-originales/11-2026', false),
  ('uy-timbre', 'UY', 'Timbre prof.', 'Timbre profesional (escrito judicial)', 'Timbre CJPPU por escrito judicial; varias denominaciones según acto.', 250, 'UYU', '2025-01-01', 'semestral', 'CJPPU / DGI', 'https://www.cjppu.org.uy/timbres.php', true),
  ('ar-uma', 'AR', 'UMA', 'Unidad de Medida Arancelaria', 'Ley 27.423 — honorarios en justicia nacional y federal. Publica la CSJN.', 89875, 'ARS', '2026-03-05', 'variable (por acordada)', 'CSJN — Res. 235/26', 'https://www.csjn.gov.ar/transparencia/uma', false);
