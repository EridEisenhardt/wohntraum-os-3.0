-- =====================================================================
-- Betriebskostenabrechnung (BK) – Datenmodell
-- Wohntraum OS · Migration vom Oktober 2026
--
-- Einspielen: Supabase → SQL Editor → komplette Datei ausführen.
-- Die Migration legt nur NEUE Tabellen mit Präfix bk_ an und verändert
-- keine bestehenden Tabellen. Sie kann gefahrlos mehrfach ausgeführt werden.
--
-- Grundidee: Eine "Abrechnung" = ein Objekt + ein Abrechnungsjahr.
-- Einheiten und Mietverhältnisse werden je Abrechnung als Stand des
-- Abrechnungsjahres gespeichert (z. B. K28 hatte 2025 nur 3 Einheiten).
-- Verteilerschlüssel hängen an der Kostenart der Abrechnung, Ausnahmen
-- an einzelnen Einheiten oder Mietverhältnissen.
-- =====================================================================

create extension if not exists pgcrypto;

-- 1) Abrechnung (Objekt + Jahr) ----------------------------------------
create table if not exists public.bk_abrechnungen (
  id              uuid primary key default gen_random_uuid(),
  gebaeude_id     text,                       -- optional: id aus public.gebaeude
  kennung         text not null,              -- Objektkürzel, z. B. A14, Rh24
  objekt_name     text,
  adresse         text,
  eigentuemer     text,                       -- z. B. Wohntraum Rheinhessen GmbH / Eric Eisenhardt
  jahr            int  not null,
  zeitraum_von    date not null,
  zeitraum_bis    date not null,
  kostenprinzip   text not null default 'abfluss' check (kostenprinzip in ('abfluss','leistung')),
  gesamtflaeche   numeric,                    -- optional fest vorgegeben, sonst Summe der Einheiten
  status          text not null default 'entwurf'
                  check (status in ('entwurf','daten_vollstaendig','berechnet','geprueft','versendet','nicht_abrechnen')),
  notiz           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (kennung, jahr)
);

-- 2) Einheiten im Abrechnungsjahr ----------------------------------------
create table if not exists public.bk_einheiten (
  id              uuid primary key default gen_random_uuid(),
  abrechnung_id   uuid not null references public.bk_abrechnungen(id) on delete cascade,
  bezeichnung     text not null,              -- z. B. WE 1, EFH, Lager 12
  kategorie       text not null default 'wohnen' check (kategorie in ('wohnen','gewerbe','stellplatz','sonstiges')),
  flaeche         numeric,                    -- m² laut Mietvertrag
  mea             numeric,                    -- Miteigentumsanteile (optional)
  einheit_ref     text,                       -- optional: id aus public.einheiten
  pos             int default 0,
  notiz           text,
  created_at      timestamptz not null default now()
);
create index if not exists bk_einheiten_abr_idx on public.bk_einheiten(abrechnung_id);

-- 3) Mietverhältnisse im Abrechnungsjahr ---------------------------------
create table if not exists public.bk_mietverhaeltnisse (
  id              uuid primary key default gen_random_uuid(),
  abrechnung_id   uuid not null references public.bk_abrechnungen(id) on delete cascade,
  einheit_id      uuid not null references public.bk_einheiten(id) on delete cascade,
  mieter          text not null,
  von             date not null,              -- Beginn innerhalb des Abrechnungsjahres
  bis             date,                       -- leer = bis Ende Abrechnungszeitraum
  personen        numeric,
  art             text not null default 'vorauszahlung'
                  check (art in ('vorauszahlung','pauschale','leerstand','eigennutzung')),
  vz_bk_mtl       numeric default 0,          -- Soll Betriebskosten-Vorauszahlung pro Monat
  vz_hk_mtl       numeric default 0,          -- Soll Heizkosten-Vorauszahlung pro Monat
  vz_bk_gezahlt   numeric,                    -- tatsächlich geleistet im Jahr (aus Kontoauszügen)
  vz_hk_gezahlt   numeric,
  anschrift       text,                       -- Versandadresse der Abrechnung
  notiz           text,
  created_at      timestamptz not null default now()
);
create index if not exists bk_mv_abr_idx on public.bk_mietverhaeltnisse(abrechnung_id);

-- 4) Kostenarten + Verteilerschlüssel je Abrechnung ----------------------
create table if not exists public.bk_kostenarten (
  id              uuid primary key default gen_random_uuid(),
  abrechnung_id   uuid not null references public.bk_abrechnungen(id) on delete cascade,
  name            text not null,              -- z. B. Grundsteuer, Müllabfuhr
  gruppe          text not null default 'betriebskosten' check (gruppe in ('betriebskosten','heizkosten')),
  schluessel      text not null default 'flaeche'
                  check (schluessel in ('flaeche','personen','einheiten','mea','verbrauch','direkt','nicht_umlegen')),
  umlagefaehig    boolean not null default true,
  betrkv_nr       text,                       -- Nummer nach § 2 BetrKV (Info)
  pos             int default 0,
  notiz           text,
  created_at      timestamptz not null default now()
);
create index if not exists bk_ka_abr_idx on public.bk_kostenarten(abrechnung_id);

-- 5) Ausnahmen zum Verteilerschlüssel ------------------------------------
--   ausschliessen : Einheit/Mieter nimmt an dieser Kostenart nicht teil
--   nur_diese     : nur die markierten Einheiten/Mieter tragen die Kostenart
--   faktor        : Gewichtung (z. B. 0.5 = halber Anteil)
--   fester_anteil : fester Prozentsatz der Kosten (wert = 0–100)
create table if not exists public.bk_ausnahmen (
  id              uuid primary key default gen_random_uuid(),
  kostenart_id    uuid not null references public.bk_kostenarten(id) on delete cascade,
  einheit_id      uuid references public.bk_einheiten(id) on delete cascade,
  mietverhaeltnis_id uuid references public.bk_mietverhaeltnisse(id) on delete cascade,
  art             text not null check (art in ('ausschliessen','nur_diese','faktor','fester_anteil')),
  wert            numeric,
  notiz           text,
  created_at      timestamptz not null default now(),
  check (einheit_id is not null or mietverhaeltnis_id is not null)
);
create index if not exists bk_aus_ka_idx on public.bk_ausnahmen(kostenart_id);

-- 6) Kosten (Buchungen) ---------------------------------------------------
create table if not exists public.bk_kosten (
  id              uuid primary key default gen_random_uuid(),
  abrechnung_id   uuid not null references public.bk_abrechnungen(id) on delete cascade,
  kostenart_id    uuid references public.bk_kostenarten(id) on delete set null,
  datum           date,
  betrag          numeric not null,           -- positiv = Kosten
  empfaenger      text,
  verwendungszweck text,
  konto           text,                       -- z. B. "Rh24 DKB"
  quelle          text default 'manuell',     -- manuell / kontoauszug / messdienst
  mietverhaeltnis_id uuid references public.bk_mietverhaeltnisse(id) on delete set null, -- bei Direktkosten
  notiz           text,
  created_at      timestamptz not null default now()
);
create index if not exists bk_kosten_abr_idx on public.bk_kosten(abrechnung_id);

-- Zeitstempel updated_at --------------------------------------------------
create or replace function public.bk_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists bk_abrechnungen_touch on public.bk_abrechnungen;
create trigger bk_abrechnungen_touch before update on public.bk_abrechnungen
  for each row execute function public.bk_touch();

-- RLS: Lesen/Schreiben/Löschen für angemeldete Nutzer; ganze Abrechnungen löschen nur Admins
do $$
declare t text;
begin
  foreach t in array array['bk_abrechnungen','bk_einheiten','bk_mietverhaeltnisse','bk_kostenarten','bk_ausnahmen','bk_kosten'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', t||'_upd', t);
    if t = 'bk_abrechnungen' then
      execute format($p$create policy %I on public.%I for delete to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))$p$, t||'_del', t);
    else
      execute format('create policy %I on public.%I for delete to authenticated using (true)', t||'_del', t);
    end if;
  end loop;
end $$;

-- Nachtrag 08.10.2026: Leere Entwürfe dürfen alle angemeldeten Nutzer löschen,
-- Abrechnungen mit Daten weiterhin nur Admins.
alter policy bk_abrechnungen_del on public.bk_abrechnungen using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  or (
    status = 'entwurf'
    and not exists (select 1 from public.bk_einheiten x where x.abrechnung_id = bk_abrechnungen.id)
    and not exists (select 1 from public.bk_mietverhaeltnisse x where x.abrechnung_id = bk_abrechnungen.id)
    and not exists (select 1 from public.bk_kostenarten x where x.abrechnung_id = bk_abrechnungen.id)
    and not exists (select 1 from public.bk_kosten x where x.abrechnung_id = bk_abrechnungen.id)
  )
);
