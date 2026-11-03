-- Persönliche Darstellung je Benutzer (Farbe, Größe, Hintergrund) – gilt nur im Bereich Verwalto
create table if not exists nutzer_einstellungen (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  darstellung jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table nutzer_einstellungen enable row level security;
create policy ne_select_self on nutzer_einstellungen for select to authenticated using (user_id = auth.uid());
create policy ne_insert_self on nutzer_einstellungen for insert to authenticated with check (user_id = auth.uid());
create policy ne_update_self on nutzer_einstellungen for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
