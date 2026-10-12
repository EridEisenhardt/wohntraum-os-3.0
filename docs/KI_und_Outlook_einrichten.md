# KI und Outlook im Wohntraum OS einrichten

Die Kacheln **Anschreiben**, **Mails** und die KI-Knöpfe bei den **Notizen** (Mieterkonten) laufen über zwei Server-Funktionen im OS:

- `app/api/ki/route.js` – KI-Texte (Brief formulieren, Notiz verbessern, Stichpunkte)
- `app/api/mails/route.js` – Outlook-Suche und Abruf von Mails (Microsoft 365)

Beide prüfen, dass der Aufruf von einem angemeldeten OS-Nutzer kommt. Die Schlüssel liegen nur auf dem Server (Vercel), nie im Browser.

## 1. KI (Anthropic)

In Vercel unter Project Settings > Environment Variables anlegen:

| Name | Wert |
|---|---|
| `ANTHROPIC_API_KEY` | API-Schlüssel aus der Anthropic Console (console.anthropic.com > API Keys) |
| `ANTHROPIC_MODEL` | optional, Standard ist `claude-sonnet-4-5` |

Danach einmal neu deployen (Deployments > Redeploy).

## 2. Outlook (Microsoft 365)

Einmalig im Microsoft Entra Admin Center (entra.microsoft.com) mit einem Admin-Konto:

1. App-Registrierungen > Neue Registrierung, Name z. B. „Wohntraum OS Mails“, nur dieses Verzeichnis.
2. API-Berechtigungen > Berechtigung hinzufügen > Microsoft Graph > **Anwendungsberechtigungen** > `Mail.Read`.
3. „Administratorzustimmung erteilen“ klicken.
4. Zertifikate & Geheimnisse > Neuer geheimer Clientschlüssel – den Wert sofort kopieren.
5. Optional, empfohlen: den Zugriff per Exchange-Richtlinie (Application Access Policy) auf die gewünschten Postfächer beschränken.

In Vercel anlegen:

| Name | Wert |
|---|---|
| `MS_TENANT_ID` | Verzeichnis-ID (Mandanten-ID) aus der Übersicht der App |
| `MS_CLIENT_ID` | Anwendungs-ID (Client-ID) |
| `MS_CLIENT_SECRET` | der geheime Clientschlüssel |
| `MS_MAILBOXES` | Postfächer, in denen gesucht wird, kommagetrennt, z. B. `ramona@andersmacher.info,eric@andersmacher.info` |

Danach neu deployen.

Ohne diese Einrichtung funktioniert in der Kachel Mails bereits das Hochladen von .eml-Dateien (Mail aus Outlook auf den Schreibtisch ziehen und hochladen).

## Ablage

- Anschreiben: PDF in der Mieterakte unter `05 Schriftverkehr`, Name nach Schema `Objekt_WE_NACHNAME Vorname_JJJJ-MM-TT_Anschreiben Betreff.pdf`; Liste im OS unter `anschreiben/…`.
- Mails: Original als .eml in der Mieterakte unter `Mails`, Name `Objekt_WE_NACHNAME Vorname_JJJJ-MM-TT_Mail Eingang|Ausgang Betreff.eml`; Liste im OS unter `mails/…`.
