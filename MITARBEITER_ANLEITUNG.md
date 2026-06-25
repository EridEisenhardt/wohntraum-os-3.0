# Mitarbeiten am Wohntraum OS — Schritt für Schritt (für alle)

So arbeitest du am Projekt: **Claude** ändert den Code, **GitHub Desktop** holt den
neuesten Stand und schickt deine Änderungen hoch. Danach prüfst du in **Vercel**, ob
es geklappt hat. Dann ist es online.

Du brauchst nur **2 Programme**. Mach genau Schritt 1, 2, 3 … der Reihe nach.
Nach wichtigen Schritten steht „✅ Du solltest jetzt sehen: …" als Kontrolle.

**Das bekommst du vorab von Eric:**
- GitHub-Login (Benutzername + Passwort) — für alle derselbe
- App-Login (E-Mail + Passwort für die fertige Webseite)

> ⚠️ Wenn etwas anders aussieht als beschrieben oder eine rote Fehlermeldung kommt:
> **nichts weiter klicken** und kurz bei Eric melden.

---

# TEIL 1 — Zwei Programme installieren (nur beim ersten Mal)

1. Öffne deinen Browser (Chrome/Edge).
2. Tippe in die Adresszeile: `claude.ai/download` → Enter.
3. Lade **Claude für Windows** (oder Mac) herunter und öffne die Datei → installieren.
4. Öffne **Claude** und melde dich mit deinem Claude-Konto an.
   ✅ Du solltest jetzt sehen: das Claude-Fenster.
5. Tippe in die Adresszeile: `desktop.github.com` → Enter.
6. Klicke **„Download for Windows"**, öffne die Datei → installiert sich selbst.
7. Öffne **GitHub Desktop** → **„Sign in to GitHub.com"** → mit dem **GitHub-Login von Eric** anmelden.
   ✅ Du solltest jetzt sehen: GitHub Desktop ist offen und angemeldet.

---

# TEIL 2 — Das Projekt herunterladen (nur beim ersten Mal)

8. In GitHub Desktop oben links **„File"** → **„Clone repository…"** klicken.
9. In der Liste **„wohntraum-os-3.0"** anklicken.
   (Falls leicht anders geschrieben: den passenden Eintrag wählen.)
10. Unten **„Clone"** klicken und warten, bis der Balken voll ist.
    ✅ Du solltest jetzt sehen: oben „Current repository: wohntraum-os-3.0".
11. Merke dir den **Ordner-Pfad**, der angezeigt wird
    (z. B. `Dokumente\GitHub\wohntraum-os-3.0`).

---

# TEIL 3 — In Claude ein Projekt anlegen & Ordner verbinden (nur beim ersten Mal)

12. Öffne **Claude Desktop**.
13. Lege ein **neues Projekt** an: in der linken Leiste auf **„Neues Projekt" / „New project"**
    klicken. Gib ihm einen Namen, z. B. **„Wohntraum OS"**, und bestätige.
    ✅ Du solltest jetzt sehen: dein Projekt **„Wohntraum OS"** ist geöffnet.
14. Verbinde den **Projektordner** mit dem Projekt:
    - Auf **„Ordner verbinden / hinzufügen"** (Ordner-Symbol) klicken und den Ordner
      aus Schritt 11 auswählen.
    - Falls du den Knopf nicht findest: schreib im Projekt
      **„Verbinde meinen Projektordner"** und gib den Pfad aus Schritt 11 an.
      Claude fragt um Erlaubnis — bestätige sie.
    ✅ Du solltest jetzt sehen: Claude bestätigt „Ordner verbunden".
15. Schreibe einmal: **„Bitte lies die Datei PROJECT_CONTEXT.md"**.
    ✅ Claude kennt jetzt das ganze Projekt.

> Ab jetzt arbeitest du immer in **diesem Projekt „Wohntraum OS"** — der Ordner bleibt
> verbunden. Teil 3 musst du nicht noch einmal machen.

---

# TEIL 4 — Arbeiten und live schalten (das machst du jedes Mal)

## Schritt A — Zuerst den neuesten Stand holen (NIE überspringen!)
16. Öffne **GitHub Desktop**.
17. Klicke oben auf **„Fetch origin"**.
18. Wenn danach **„Pull origin"** erscheint, klicke auch darauf.
    ✅ Damit hast du, was die anderen zuletzt gemacht haben.

## Schritt B — Mit Claude die Änderung machen
19. Öffne in **Claude** dein Projekt **„Wohntraum OS"**.
20. Schreibe, was gemacht werden soll (z. B. „Füge in der Firmenliste ein Suchfeld hinzu").
21. Warte, bis Claude sagt, dass es fertig ist.

## Schritt C — Hochladen
22. Wechsle zu **GitHub Desktop**.
    ✅ Du solltest jetzt sehen: links eine Liste der geänderten Dateien.
23. Unten ins Feld **„Summary"** kurz schreiben, was du gemacht hast.
24. Blauen Knopf **„Commit to main"** klicken.
25. Oben **„Push origin"** klicken.
    ✅ „Push origin" verschwindet / wird grau = hochgeladen.

## Schritt D — In Vercel prüfen, ob es geklappt hat (WICHTIG)
26. Öffne im Browser: `vercel.com` → einloggen (gemeinsames Konto).
27. Projekt **„wohntraum-os-3-0"** öffnen → oben Reiter **„Deployments"**.
28. Schau auf den **obersten Eintrag** (dein gerade hochgeladener Stand):
    - 🟡 „Building" = baut noch → ~1 Minute warten, Seite neu laden.
    - ✅ **„Ready"** (grün) = alles gut → weiter zu Schritt E.
    - ❌ **„Error"/„Failed"** (rot) = Fehler → mach Schritt 29.

## Wenn ❌ ein Fehler kommt (Fehler-Schleife)
29. Auf den roten Eintrag klicken → dann auf **„Build Logs"** (oder „View Logs").
30. Die **rote Fehlermeldung** mit der Maus markieren und kopieren (**Strg + C**).
31. In **Claude** (Projekt „Wohntraum OS") einfügen (**Strg + V**) mit dem Satz:
    **„Der Vercel-Deploy ist mit diesem Fehler fehlgeschlagen, bitte behebe ihn: …"**
32. Warte, bis Claude die Dateien korrigiert hat.
33. Mach erneut **Schritt C** (Summary → Commit to main → Push origin).
34. Prüfe wieder in Vercel (Schritt 27–28). Wiederhole, bis dort **„Ready"** (grün) steht.

## Schritt E — Ergebnis ansehen
35. Wenn Vercel **„Ready"** zeigt: Öffne **https://os-wohntraumrheinhessen.de**
36. Drücke **F5** (Seite neu laden). Deine Änderung ist jetzt online.

---

# Die 4 wichtigsten Regeln
1. **Immer zuerst Schritt A** (Fetch/Pull), bevor du mit Claude anfängst.
2. **Am Ende immer Schritt C** (Commit + Push), sonst sieht es niemand.
3. **Nach jedem Push in Vercel prüfen** (Schritt D): erst bei grün **„Ready"** ist es live.
   Bei rotem Fehler die Fehler-Schleife (Schritt 29–34).
4. Den Projektordner **niemals** in Google Drive / Dropbox legen.

# Häufige Fragen
- **„Push origin" ist grau / passiert nichts?** → Erst Schritt 23–24 (Summary + Commit),
  dann lässt sich „Push" klicken.
- **GitHub Desktop zeigt „Pull origin" mit einer Zahl?** → Einfach anklicken
  (das sind Änderungen der anderen), dann normal weiter.
- **Rote Meldung / „Conflict"?** → Nicht weiterklicken, Eric kurz fragen.

# Infos
- Fertige App: **https://os-wohntraumrheinhessen.de**
- Projekt-Überblick: Datei **PROJECT_CONTEXT.md** im Ordner.
