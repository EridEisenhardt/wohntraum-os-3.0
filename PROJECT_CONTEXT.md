# Wohntraum Rheinhessen OS — Projekt-Kontext & Onboarding

Internes Steuerungs-/CRM-System für die Immobilienfirma. Diese Datei gibt neuen
Entwickler:innen (und KI-Assistenten wie Claude) in wenigen Minuten den vollen Überblick.

## 1. Tech-Stack
- **Next.js 14** (App Router, JavaScript — kein TypeScript), reines CSS über CSS-Variablen
- **Supabase** (PostgreSQL, Auth, Storage) als Backend
- **Vercel** Hosting (Auto-Deploy bei Push auf `main`)
- Frontend ist fast vollständig **clientseitig** (`'use client'`), Daten direkt via supabase-js

## 2. Wichtige Links / IDs
- Live: https://os-wohntraumrheinhessen.de  (+ https://wohntraum-os-3-0.vercel.app)
- GitHub-Repo: EridEisenhardt/wohntraum-os-app (privat)
- Supabase-Projekt-Ref: `jqzxctfqvcwbctpjksvg`
- Supabase-URL: https://jqzxctfqvcwbctpjksvg.supabase.co
- Region: eu-central-1 (Frankfurt)

## 3. Lokales Setup
```
git clone <repo>            # via GitHub Desktop oder CLI
cd wohntraum-os
npm install
npm run dev                 # http://localhost:3000
```
Node 18+ (getestet mit 22). Umgebungsvariablen liegen in `.env.production` (öffentlicher
anon-Key, unkritisch). Für lokal kann man `.env.local` mit denselben zwei Werten anlegen:
```
NEXT_PUBLIC_SUPABASE_URL=https://jqzxctfqvcwbctpjksvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```
Der `service_role`-Key gehört NIEMALS ins Repo/Frontend.

## 4. Ordnerstruktur
```
app/
  page.js                       Cockpit (live KPIs, Aktivitäten, Aufgaben, Doku-Ablauf, Rollen)
  layout.js                     Root-Layout -> AppShell
  gf-dashboard/page.js          GF-Dashboard (iframe -> public/gf-dashboard.html)
  aktivitaeten/page.js          Globale Aktivitäten (Filter, Suche, Schnellerfassung)
  dokumente/page.js             DMS (Upload, Liste, Vorschau, Versionen, Teilen-Link)
  finance/darlehen/page.js      Finance (iframe -> public/finance-darlehen.html, Supabase)
  planung/baustandard/page.js   Planung (iframe -> public/baustandard.html)
  nutzer/page.js                Nutzerverwaltung (Rollen)
  stammdaten/
    kontakte/page.js            Kontaktliste
    kontakte/[id]/page.js       Kontakt-Detail + Aktivitäten + Dokumente
    firmen/page.js              Firmenliste
    firmen/[id]/page.js         Firmen-Detail + Kontakte + Aktivitäten + Dokumente
components/                     Sidebar, AppShell (Auth-Gate), Formular-Modale, ...
lib/                            supabaseClient, sampleData (Labels/Fallback), dms, activities, roles
public/                         3 eigenständige HTML-Module (iframe-eingebettet)
```
Die drei `public/*.html`-Module (Darlehen, Baustandard, GF-Dashboard) sind eigenständige
HTML/JS-Seiten, die per iframe eingebunden sind. Darlehen ist an Supabase angebunden;
Baustandard & GF-Dashboard nutzen noch statische/lokale Daten.

## 5. Datenbank (Supabase, public-Schema)
Tabellen: `profiles`, `companies`, `contacts`, `contact_roles`, `tags`, `contact_tags`,
`activities`, `documents`, `document_versions`, `document_tags`, `document_audit`, `loans`.
- RLS ist überall aktiv. Standard: Lesen/Schreiben für `authenticated`; Löschen meist nur Admin.
- Rollen-Enum `app_role`: `admin` / `supervisor` / `junior` (Default junior). Trigger
  `guard_profile_changes` verhindert, dass Nicht-Admins Rolle/Status ändern.
- Storage-Bucket `dokumente` (privat) für DMS-Dateien; Zugriff via signierte URLs.
Schema-Änderungen laufen über den Supabase **SQL-Editor** (Migrationen) bzw. den
Supabase-MCP-Connector in Claude.

## 6. Auth / Rollen
- Login über Supabase Auth (E-Mail/Passwort). Neue Nutzer: „Registrieren" am Login oder
  in Supabase → Authentication → Users (mit „Auto Confirm").
- Zum Admin machen: `update public.profiles set role='admin' where email='...';`
- Nach Domainwechsel: Supabase → Authentication → URL Configuration → Site URL auf Live-Domain.

## 7. Deployment
- Push auf `main` → Vercel baut & deployt automatisch.
- **Vercel Hobby-Plan-Falle:** Bei privatem Repo deployt Vercel nur Commits, deren Autor
  das verknüpfte Vercel-Konto ist. Für Team: entweder gemeinsames GitHub-Konto, oder
  Vercel Pro, oder Repo öffentlich. Git-Commit-E-Mail in GitHub Desktop muss zum
  GitHub-Konto passen, sonst wird der Deploy geblockt.

## 8. Konventionen
- Komponenten als Client Components (`'use client'`), Daten via `supabase` aus `lib/supabaseClient`.
- Styling ausschließlich über die CSS-Variablen/Klassen in `app/globals.css` (heller OS-Look,
  Akzent `--accent: #185fa5`, Schrift Inter/System).
- Deutschsprachige UI-Texte.
- Neue Tabellenfelder: Migration in Supabase + Felder in den jeweiligen Formularen ergänzen.

## 9. Stand / offene Punkte (Ideen)
Fertig: Login+Rollen, Cockpit (live), Kontakte (Liste/Detail/Aktivitäten), Firmen
(Liste/Detail), DMS, globale Aktivitäten, Nutzerverwaltung, Finance/Darlehen (Supabase),
Planung/Baustandard, GF-Dashboard.
Offen: Suche/Filter/Sortierung in Listen · feinere Rechte supervisor vs. junior (RLS) ·
CSV-Import Kontakte/Firmen · Baustandard & GF-Dashboard an Supabase anbinden ·
DMS-Aufbewahrungsfristen/Löschvorschläge · Finance: company_id-Verknüpfung im Formular.

## 10. Mit Claude weiterarbeiten (anderer Laptop)
1. Repo klonen.
2. Claude-Desktop/Cowork öffnen, den geklonten Projektordner als Ordner verbinden.
3. Optional Supabase-Connector verbinden (für DB-Änderungen).
4. Diese Datei dient als Kontext — einfach Claude darauf verweisen.
