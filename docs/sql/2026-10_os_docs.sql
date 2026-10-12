-- Dokumentenspeicher für die aus Claude-Artifacts übernommenen Seiten
-- (Monatswechsel Fixkosten = app 'mw', Objekt-Controlling = app 'oc')
create table if not exists public.os_docs (
  app text not null,
  pfad text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (app, pfad)
);
alter table public.os_docs enable row level security;
create policy os_docs_all on public.os_docs for all to authenticated using (true) with check (true);
alter table public.os_docs replica identity full;
alter publication supabase_realtime add table public.os_docs;
