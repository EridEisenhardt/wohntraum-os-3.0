# Deployment: Wohntraum OS über Hostinger „Web Apps" (gemanagt)

Der einfachste Weg: Hostinger baut und hostet Next.js automatisch — kein Server,
keine Kommandozeile, kostenloses SSL inklusive.

## Voraussetzung
- Ein **Business- oder Cloud-Webhosting-Paket** mit „Web Apps" (Node.js).
  (Das ist NICHT der VPS. Hast du nur den VPS, brauchst du so ein Paket — oder wir
  nehmen die Coolify-Variante auf dem VPS.)
- Die Werte sind schon im Projekt hinterlegt (`.env.production`), du musst nichts eintragen.

## Schritte (im hPanel)
1. Im hPanel auf **Web Apps** gehen → **Create / Add application**.
2. Framework: **Next.js** auswählen (wird meist automatisch erkannt).
3. Quelle wählen — eine der beiden:
   - **GitHub verbinden** (empfohlen für spätere Updates): Repo auswählen, Branch `main`.
   - **ZIP hochladen**: die Datei `wohntraum-os.zip` hochladen.
4. Node-Version: **22**. Build-Command: `npm run build`. Start-Command: `npm start`.
   (Hostinger setzt diese i.d.R. automatisch.)
5. **Deploy** klicken. Hostinger installiert, baut und startet die App.
6. **Domain verbinden**: deine Domain/Subdomain (z.B. os.wohntraumrheinhessen.site)
   der Web-App zuweisen — SSL wird automatisch erstellt.

## Nach dem Go-Live (wichtig)
Im Supabase-Dashboard → **Authentication → URL Configuration**:
- **Site URL** = `https://DEINE-DOMAIN`
Sonst funktionieren Login-Weiterleitungen/Bestätigungen auf der Live-Domain nicht.

## Umgebungsvariablen
Sind über `.env.production` im Projekt schon gesetzt:
```
NEXT_PUBLIC_SUPABASE_URL=https://jqzxctfqvcwbctpjksvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=… (öffentlicher anon-Key)
```
Falls Hostinger eigene Felder dafür anbietet, kannst du dieselben zwei Werte dort eintragen.

## Updates später
- Mit GitHub-Anbindung: Änderung pushen → Hostinger deployt automatisch.
- Mit ZIP: neues `wohntraum-os.zip` hochladen → „Redeploy".

## Referenz
Hostinger stellt eine offizielle Next.js-Vorlage/Anleitung bereit:
https://github.com/hostinger/deploy-nextjs
