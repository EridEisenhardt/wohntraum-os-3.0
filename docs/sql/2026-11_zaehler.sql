-- Zähler: Kundennummer, Jahresablesung (aus Nahaus-Export) und Verknüpfung der Stände mit dem Übergabeprotokoll
alter table public.objekt_zaehler add column if not exists kundennummer text;
alter table public.objekt_zaehler add column if not exists jahresablesung boolean;
alter table public.objekt_zaehlerstaende add column if not exists uebergabe_id text;
