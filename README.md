# Wohntraum Rheinhessen OS — Web-App

Steuerungs-Cockpit für die Immobilienfirma. Next.js (App Router) + Supabase.
Mit Login, Cockpit, und Stammdaten (Kontakte & Firmen) inkl. Anlegen/Bearbeiten/Löschen.

## Dein Supabase-Projekt ist bereits verbunden
Die Datei `.env.local` ist schon mit deinem Projekt vorausgefüllt:
- URL: https://jqzxctfqvcwbctpjksvg.supabase.co
- anon-Key (öffentlich, fürs Frontend okay)

Das Datenbank-Schema ist im Projekt bereits eingespielt (7 Tabellen, RLS aktiv).

## Start in 2 Schritten
1. Im Projektordner (einmalig):
   ```
   npm install
   ```
2. Starten:
   ```
   npm run dev
   ```
   Browser: http://localhost:3000

> Hinweis: Wenn du dieses ZIP über deine bestehende Version entpackst,
> bleibt dein `node_modules` erhalten — `npm install` reicht zur Sicherheit trotzdem.
> Danach ggf. den Sicherheits-Patch: `npm install next@^14`.

## Login einrichten (einmalig)
Daten sind durch RLS nur für eingeloggte Nutzer sichtbar. Lege deinen Nutzer an:

**Variante A (empfohlen, sofort nutzbar):** In Supabase → Authentication → Users →
"Add user" → deine E-Mail + Passwort, Haken bei **"Auto Confirm User"** setzen.
Dann in der App einloggen.

**Variante B:** In der App auf "Registrieren" — je nach Projekteinstellung kommt
eine Bestätigungs-E-Mail, die du erst bestätigen musst.

Danach dich zum Admin machen (Supabase → SQL Editor):
```sql
update public.profiles set role = 'admin' where email = 'deine@email.de';
```

## Was die App kann
- **Login / Logout** (Supabase Auth)
- **Cockpit**: KPI-Karten (Kontakte/Firmen live aus der DB), Aktivitäten, Rollen
- **Kontakte**: Liste + Anlegen/Bearbeiten/Löschen, mit Firma, Rollen, DSGVO-Feldern
- **Firmen**: Liste + Anlegen/Bearbeiten/Löschen

## Nächste Schritte (Ideen)
- Suche & Filter in den Listen
- Detailansicht je Kontakt mit Aktivitäten-Verlauf
- Objekte/Immobilien-Modul
