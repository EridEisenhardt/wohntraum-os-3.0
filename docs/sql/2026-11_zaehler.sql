-- Zähler: Kundennummer, Jahresablesung (aus Nahaus-Export) und Verknüpfung der Stände mit dem Übergabeprotokoll
alter table public.objekt_zaehler add column if not exists kundennummer text;
alter table public.objekt_zaehler add column if not exists jahresablesung boolean;
alter table public.objekt_zaehlerstaende add column if not exists uebergabe_id text;

-- Versorger und Vertrag je Zähler
alter table objekt_zaehler add column if not exists versorger text;
alter table objekt_zaehler add column if not exists vertrag_pfad text;
alter table objekt_zaehler add column if not exists vertrag_name text;

-- Speicher für hochgeladene BK-Belege (nicht mehr in OneDrive)
insert into storage.buckets (id, name, public, file_size_limit) values ('bk-belege','bk-belege',false, 20971520) on conflict (id) do nothing;
create policy bk_belege_auth on storage.objects for all to authenticated using (bucket_id = 'bk-belege') with check (bucket_id = 'bk-belege');
