-- Zähler: Kundennummer, Jahresablesung (aus Nahaus-Export) und Verknüpfung der Stände mit dem Übergabeprotokoll
alter table public.objekt_zaehler add column if not exists kundennummer text;
alter table public.objekt_zaehler add column if not exists jahresablesung boolean;
alter table public.objekt_zaehlerstaende add column if not exists uebergabe_id text;

-- Versorger und Vertrag je Zähler
alter table objekt_zaehler add column if not exists versorger text;
alter table objekt_zaehler add column if not exists vertrag_pfad text;
alter table objekt_zaehler add column if not exists vertrag_name text;
