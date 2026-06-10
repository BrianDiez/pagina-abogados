-- LegalHub — Funciones de negocio

-- ─────────────────────────────────────────────────────────────
-- Slots disponibles: única fuente de verdad de disponibilidad.
-- horarios semanales − bloqueos − turnos activos − anticipación mín/máx.
-- Devuelve slots en la zona horaria del parámetro tz (default Montevideo).
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_available_slots(
  p_lawyer_id uuid,
  p_service_id uuid,
  p_from date,
  p_to date,
  p_tz text default 'America/Montevideo'
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable security definer set search_path = public
as $$
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
    into svc
  from public.services
  where id = p_service_id and lawyer_id = p_lawyer_id and is_active;

  if svc is null then
    return;
  end if;

  not_before := now() + make_interval(hours => svc.min_advance_hours);
  not_after  := now() + make_interval(days => svc.max_advance_days);

  for d in select generate_series(p_from, p_to, interval '1 day')::date loop
    for win in
      select a.start_time, a.end_time
      from public.availability a
      where a.lawyer_id = p_lawyer_id
        and a.is_active
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
            select 1 from public.time_blocks tb
            where tb.lawyer_id = p_lawyer_id
              and tstzrange(tb.start_at, tb.end_at) && tstzrange(cursor_t, candidate_end)
          )
          and not exists (
            select 1 from public.appointments ap
            where ap.lawyer_id = p_lawyer_id
              and ap.status in ('pending_payment', 'confirmed')
              and tstzrange(ap.starts_at, ap.ends_at) && tstzrange(cursor_t, candidate_end)
          )
        then
          slot_start := cursor_t;
          slot_end := candidate_end;
          return next;
        end if;

        cursor_t := candidate_end + make_interval(mins => svc.break_after_minutes);
      end loop;
    end loop;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Estadísticas agregadas por profesional (rating, consultas, recomendación)
-- ─────────────────────────────────────────────────────────────
create or replace view public.lawyer_stats
with (security_invoker = false) as
select
  l.id as lawyer_id,
  count(distinct a.id) filter (where a.status = 'completed') as completed_consultations,
  count(distinct r.id) as review_count,
  round(avg(r.rating_overall) filter (where r.is_published), 2) as avg_rating,
  round(
    100.0 * count(*) filter (where r.would_recommend and r.is_published)
    / nullif(count(r.id) filter (where r.is_published), 0)
  ) as recommend_pct
from public.lawyers l
left join public.appointments a on a.lawyer_id = l.id
left join public.reviews r on r.lawyer_id = l.id
group by l.id;

grant select on public.lawyer_stats to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Contador de vistas de perfil (llamable anónimamente, sin exponer update)
-- ─────────────────────────────────────────────────────────────
create or replace function public.increment_profile_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.lawyers set profile_views = profile_views + 1 where slug = p_slug;
$$;

grant execute on function public.increment_profile_views(text) to anon, authenticated;
grant execute on function public.get_available_slots(uuid, uuid, date, date, text) to anon, authenticated;
