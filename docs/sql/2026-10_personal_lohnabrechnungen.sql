-- 12.10.2026: Personaldaten nur noch für angemeldete Nutzer (vorher auch anonym lesbar)
alter policy mitarbeiter_all on public.mitarbeiter to authenticated;
alter policy mitarbeiter_gegenstaende_all on public.mitarbeiter_gegenstaende to authenticated;
alter policy pmx_all on public.personal_matrix to authenticated;

-- Hochgeladene Lohnauswertungen je Gesellschaft und Monat (Seite Personal · Lohnkosten)
create table if not exists public.personal_lohnabrechnungen (
  id uuid primary key default gen_random_uuid(),
  unternehmen text not null,
  jahr int not null,
  monat int not null check (monat between 1 and 12),
  datei_url text,
  datei_name text,
  pfad text,
  uebernommen_am timestamptz,
  created_at timestamptz not null default now()
);
alter table public.personal_lohnabrechnungen enable row level security;
create policy plab_all on public.personal_lohnabrechnungen for all to authenticated using (true) with check (true);
