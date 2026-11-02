-- Personal · Stundenzettel (Crewmeister) und Lohntabelle für den Steuerberater
create table if not exists public.personal_stunden (
  id uuid primary key default gen_random_uuid(),
  mitarbeiter_id uuid not null references public.mitarbeiter(id),
  jahr int not null, monat int not null,
  soll numeric, ist numeric, ee_aus numeric, ee_kat numeric,
  urlaub_tage numeric, krank_tage numeric,
  cm_start numeric, cm_ende numeric,
  datei_url text, datei_name text, pfad text, notiz text,
  updated_at timestamptz default now(),
  unique (mitarbeiter_id, jahr, monat)
);
alter table public.personal_stunden enable row level security;
create policy pstd_all on public.personal_stunden for all to authenticated using (true) with check (true);
create table if not exists public.personal_lohntabelle (
  id uuid primary key default gen_random_uuid(),
  mitarbeiter_id uuid not null references public.mitarbeiter(id),
  jahr int not null, monat int not null,
  grundgehalt numeric, zusatz_std numeric, stundenlohn numeric, sachbezug numeric,
  urlaub_tage numeric, au_abfrage text, au_lag_vor text, au_von date, au_bis date,
  updated_at timestamptz default now(),
  unique (mitarbeiter_id, jahr, monat)
);
alter table public.personal_lohntabelle enable row level security;
create policy plt_all on public.personal_lohntabelle for all to authenticated using (true) with check (true);
create table if not exists public.personal_stunden_stamm (
  mitarbeiter_id uuid primary key references public.mitarbeiter(id),
  start_std numeric, start_ab text, ee_folgemonat boolean default false, ee_id uuid,
  updated_at timestamptz default now()
);
alter table public.personal_stunden_stamm enable row level security;
create policy pss_all on public.personal_stunden_stamm for all to authenticated using (true) with check (true);
-- Infos je Monat: os_docs app='personal', pfad='lohntabelle/YYYY-MM' {infos}
-- Abgeschlossene Monate: os_docs app='personal', pfad='stundenzettel/abschluss' {"YYYY-MM": datum}
