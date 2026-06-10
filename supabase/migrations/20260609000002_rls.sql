-- LegalHub — Row Level Security

alter table public.profiles enable row level security;
alter table public.lawyers enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.time_blocks enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.documents enable row level security;
alter table public.articles enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

-- Helpers
create or replace function public.current_lawyer_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.lawyers where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: cada uno ve/edita el suyo; admin todo
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- lawyers: lectura pública de perfiles activos (directorio); el dueño edita el suyo
create policy "lawyers_public_read" on public.lawyers
  for select using (is_active or user_id = auth.uid() or public.is_admin());
create policy "lawyers_insert_own" on public.lawyers
  for insert with check (user_id = auth.uid());
create policy "lawyers_update_own" on public.lawyers
  for update using (user_id = auth.uid() or public.is_admin());

-- services / availability: lectura pública, escritura del dueño
create policy "services_public_read" on public.services
  for select using (true);
create policy "services_owner_write" on public.services
  for all using (lawyer_id = public.current_lawyer_id())
  with check (lawyer_id = public.current_lawyer_id());

create policy "availability_public_read" on public.availability
  for select using (true);
create policy "availability_owner_write" on public.availability
  for all using (lawyer_id = public.current_lawyer_id())
  with check (lawyer_id = public.current_lawyer_id());

create policy "time_blocks_owner_all" on public.time_blocks
  for all using (lawyer_id = public.current_lawyer_id())
  with check (lawyer_id = public.current_lawyer_id());

-- clients: el cliente ve su registro; los profesionales ven clientes con los que tienen turnos
create policy "clients_select_own" on public.clients
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.client_id = clients.id and a.lawyer_id = public.current_lawyer_id()
    )
  );
create policy "clients_insert_any_auth" on public.clients
  for insert with check (auth.uid() is not null);
create policy "clients_update_own" on public.clients
  for update using (user_id = auth.uid());

-- appointments: visibles solo para su profesional y su cliente.
-- Nota: lawyer_notes es privado del profesional — el front del cliente consume
-- la vista appointments_client_view; además el API nunca selecciona esa columna
-- para clientes. (Postgres no tiene RLS por columna; la vista es la barrera.)
create policy "appointments_parties_read" on public.appointments
  for select using (
    lawyer_id = public.current_lawyer_id()
    or exists (select 1 from public.clients c where c.id = appointments.client_id and c.user_id = auth.uid())
    or public.is_admin()
  );
create policy "appointments_client_create" on public.appointments
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );
create policy "appointments_parties_update" on public.appointments
  for update using (
    lawyer_id = public.current_lawyer_id()
    or exists (select 1 from public.clients c where c.id = appointments.client_id and c.user_id = auth.uid())
  );

create view public.appointments_client_view
with (security_invoker = true) as
  select id, lawyer_id, client_id, service_id, status, starts_at, ends_at,
         modality, client_notes, video_room_url, price, currency, payment_status,
         cancelled_by, cancellation_reason, created_at
  from public.appointments;

-- payments: cada parte ve los suyos; solo service_role escribe (webhooks)
create policy "payments_parties_read" on public.payments
  for select using (
    lawyer_id = public.current_lawyer_id()
    or exists (select 1 from public.clients c where c.id = payments.client_id and c.user_id = auth.uid())
    or public.is_admin()
  );

-- reviews: lectura pública de publicadas; crea el cliente de la consulta; responde el profesional
create policy "reviews_public_read" on public.reviews
  for select using (is_published or lawyer_id = public.current_lawyer_id() or public.is_admin());
create policy "reviews_client_create" on public.reviews
  for insert with check (
    exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );
create policy "reviews_lawyer_respond" on public.reviews
  for update using (lawyer_id = public.current_lawyer_id() or public.is_admin());

-- documents: profesional dueño; cliente solo si está compartido
create policy "documents_owner_all" on public.documents
  for all using (lawyer_id = public.current_lawyer_id())
  with check (lawyer_id = public.current_lawyer_id());
create policy "documents_client_shared_read" on public.documents
  for select using (
    is_shared_with_client
    and exists (select 1 from public.clients c where c.id = documents.client_id and c.user_id = auth.uid())
  );

-- articles: lectura pública de publicados; escribe el dueño
create policy "articles_public_read" on public.articles
  for select using (is_published or lawyer_id = public.current_lawyer_id());
create policy "articles_owner_write" on public.articles
  for all using (lawyer_id = public.current_lawyer_id())
  with check (lawyer_id = public.current_lawyer_id());

-- messages: solo emisor y receptor
create policy "messages_parties_read" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "messages_sender_create" on public.messages
  for insert with check (sender_id = auth.uid());
create policy "messages_receiver_mark_read" on public.messages
  for update using (receiver_id = auth.uid());

-- subscriptions: el profesional ve la suya; escribe service_role
create policy "subscriptions_owner_read" on public.subscriptions
  for select using (lawyer_id = public.current_lawyer_id() or public.is_admin());
