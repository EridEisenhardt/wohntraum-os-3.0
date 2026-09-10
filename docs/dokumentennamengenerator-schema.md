# Dokumentennamen-Generator — Schema & Systematik

Seite: `public/dokumentnamen.html` · Route `/produktivitaet/dokumentnamen`
Datenquelle: Supabase-Tabelle **`dokument_vorlagen`** (+ `sanierungen` für Projektnummern)
Stand: 2026-09-10

Der Generator erzeugt aus **Vorlagen mit Platzhaltern** standardisierte Dateinamen. Die Vorlagen liegen in der DB und sind dort pflegbar (aktiv/inaktiv, Sortierung, Template). Die Seite lädt nur aktive Vorlagen (`aktiv = true`), gruppiert sie nach Kategorie und füllt die im Template enthaltenen Platzhalter über Eingabefelder.

---

## 1. Tabelle `dokument_vorlagen`

| Spalte | Typ | Pflicht | Default | Bedeutung |
|---|---|---|---|---|
| `id` | uuid | ja | `gen_random_uuid()` | Primärschlüssel |
| `kategorie` | text | nein | — | Rubrik (Gruppierung in der UI), z. B. „Mieter", „Bank & Darlehen" |
| `dokument` | text | **ja** | — | Anzeigename der Vorlage (Dokumententyp) |
| `template` | text | **ja** | — | Namensschema mit Platzhaltern `{TOKEN}` |
| `hinweis` | text | nein | — | Zusatzhinweis (z. B. Ablageort), in der UI als Tag angezeigt |
| `sort` | integer | nein | `0` | Sortierreihenfolge innerhalb der Kategorie |
| `aktiv` | boolean | nein | `true` | Nur aktive Vorlagen erscheinen im Generator |
| `bank_nr` | text | nein | — | Optionales Präfix im „Bankenstruktur"-Modus (z. B. `50`, `62`) |

RLS: permissive Policy (`using(true) with check(true)`), Zugriff über den anon-Key wie die übrigen OS-Tabellen.

---

## 2. Platzhalter (Tokens)

Im `template` stehen Platzhalter in geschweiften Klammern `{TOKEN}`. Der Generator liest die enthaltenen Tokens automatisch aus (`{([A-Z0-9\-]+)}`) und erzeugt pro Token ein Eingabefeld.

| Token | Feld-Label | Typ | Formatregel |
|---|---|---|---|
| `KOST` | Objektkürzel (KOST) | Text | — |
| `OBJEKT` | Objekt | Text | — |
| `YYYY-MM-DD` | Datum | Datum | ISO-Datum (Standard = heute) |
| `JAHR` | Jahr | Text | JJJJ |
| `BANK` | Bank | Text | — |
| `DLNR` | Darlehensnummer | Text | — |
| `BETRAG` | Betrag | Text | z. B. `480k` oder `1.234,56` |
| `NACHNAME` | Nachname | Text | **GROSS** (Uppercase) |
| `VORNAME` | Vorname | Text | **1. Buchstabe groß** (Capitalize je Wort) |
| `WE` | Wohneinheit | Text | **GROSS** (Uppercase) |
| `LIEFERANT` | Lieferant / Firma | Text | — |
| `RENR` | Rechnungs-Nr | Text | — |
| `PROJEKTNR` | Projektnummer | Text | aus KPI-Sanierungen (`sanierungen.projektnummer`), neu hinterlegbar |
| `BEHOERDE` | Behörde / Absender | Text | z. B. Gemeinde, FA |
| `THEMA` | Thema | Text | z. B. Strom, Gas, Wasser, Hausmeister |
| `DOKUMENT` | Bezeichnung | Text | freie Bezeichnung |

---

## 3. Namens-Logik (Aufbau des Dateinamens)

1. Für jedes Token im Template wird der Feldwert eingesetzt.
2. **Formatierung beim Einsetzen:**
   - `NACHNAME`, `WE` → komplett **Großbuchstaben**.
   - `VORNAME` → jeder Wortanfang groß (Capitalize).
3. **Aufräumen der Trenner** (falls Platzhalter leer bleiben):
   - Mehrfache `_` → ein `_`; mehrfache Leerzeichen → eines; `, ,` → `,`.
   - Führende/abschließende `_`, Leerzeichen, Kommas werden entfernt.
   - `_ €` → `€`; `, _` → `_`.
4. **Modus „Bankenstruktur":** Ist im Modus *Bank* eine Bank-Nr. gesetzt (aus `bank_nr` bzw. dem Feld), wird sie als Präfix vorangestellt: `NR_<restlicher Name>`.
5. Ergebnis: der fertige Dateiname (ohne Endung). Beim Download wird die Original-Dateiendung angehängt.

**Zwei Modi (UI-Umschalter):**
- **📁 Eigene Unterlagen** — Standardmodus, ohne Bank-Präfix.
- **🏦 Bankenstruktur** — mit Bank-/Ablagenummern-Präfix (`bank_nr`), passend zur Ordnersystematik der Bank.

**Kategorie „Mieter" (Sonderfall UI):** Wird die Rubrik *Mieter* gewählt, erscheint statt der Chip-Liste ein Dropdown zur Auswahl des Mieter-Dokuments; die feste Feldreihenfolge ist **Objekt (KOST) · Wohneinheit (WE) · Nachname · Vorname · Datum · Typ**.

---

## 4. Vorlagen je Kategorie (aktueller Stand)

### An- & Verkauf
| Dokument | Template | Bank-Nr |
|---|---|---|
| Kaufvertrag (KV) | `{KOST}_{YYYY-MM-DD}_KV_Verkäufer an Käufer_{BETRAG}` | — |
| Kaufvertragsentwurf (KVE) | `{KOST}_{YYYY-MM-DD}_KVE_Verkäufer an Käufer_{BETRAG}` | — |
| Grundbuchauszug nach Kauf | `{KOST}_{YYYY-MM-DD}_GBA_GB-Auszug nach finalem Transaktionsvollzug` | — |
| Grundschuldbestellung (GSB) | `{KOST}_{YYYY-MM-DD}_GSB_Verkäufer an Käufer_{BETRAG}` | 50 |
| Kaufpreiszahlung | `{KOST}_{YYYY-MM-DD}_Kaufpreiszahlung_{BETRAG}€` | — |

### Bank & Darlehen (Ablage: 7400 / Objekt / 50)
| Dokument | Template | Bank-Nr |
|---|---|---|
| Darlehensvertrag (Bank) | `50_{DLNR}_Darlehensvertrag_{OBJEKT}_{YYYY-MM-DD}_{BETRAG}_{BANK}` | 50 |
| Bürgschaft | `50_{DLNR}_Bürgschaft_{OBJEKT}_{YYYY-MM-DD}_{BANK}` | 50 |
| Grundschuld | `50_{DLNR}_Grundschuld_{OBJEKT}_{YYYY-MM-DD}_{BANK}` | 50 |
| Zweckerklärung Grundschulden | `50_{DLNR}_Zweckerklärung Grundschulden_{OBJEKT}_{YYYY-MM-DD}_{BANK}` | 50 |
| Finanzierungsbestätigung | `50_{DLNR}_Finanzierungsbestätigung_{OBJEKT}_{YYYY-MM-DD}_{BANK}` | 50 |
| Zahlungsauftrag | `50_{DLNR}_Zahlungsauftrag_{OBJEKT}_{YYYY-MM-DD}_{BETRAG}_{BANK}` | 50 |

### Behörden & Bescheide
| Dokument | Template |
|---|---|
| Grundsteuerbescheid | `{KOST}_{YYYY-MM-DD}_{BEHOERDE}_Grundsteuerbescheid für {JAHR}_{BETRAG}` |
| Grundbesitzabgabenbescheid | `{KOST}_{YYYY-MM-DD}_{BEHOERDE}_Grundbesitzabgabenbescheid für {JAHR}_{BETRAG}` |
| Grunderwerbsteuerbescheid | `{KOST}_{YYYY-MM-DD}_FA_Grunderwerbssteuerbescheid_{BETRAG}` |

### Mieter (Reihenfolge: KOST · WE · Nachname Vorname · Datum · Typ · Ablage 3500)
| Dokument | Template | Bank-Nr |
|---|---|---|
| Mietvertrag | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Mietvertrag` | 62 |
| Mieterselbstauskunft | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Mieterselbstauskunft` | — |
| Mietangebot | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Mietangebot` | — |
| Mietkalkulation | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Mietkalkulation` | — |
| Wohnungsgeberbescheinigung | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Wohnungsgeberbescheinigung` | — |
| Übergabeprotokoll Einzug | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Übergabeprotokoll Einzug` | — |
| Übergabeprotokoll Auszug | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Übergabeprotokoll Auszug` | — |
| Ratenzahlungsvereinbarung | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Ratenzahlungsvereinbarung` | — |
| Onlineserviceportal | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Onlineserviceportal` | — |
| Kostenübernahme | `{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Kostenübernahme` | — |
| _Mietvertrag (für Bank/Käufer)_ — **inaktiv** | `62 Mietvertrag_{KOST}_{WE}_{NACHNAME} {VORNAME}_{YYYY-MM-DD}_Mietvertrag` | 62 |

### Objektunterlagen
| Dokument | Template | Bank-Nr |
|---|---|---|
| Energieausweis | `{KOST}_{YYYY-MM-DD}_Energieausweis` | 71 |
| Teilungserklärung | `{KOST}_{YYYY-MM-DD}_Teilungserklärung` | — |
| Baulast | `75 Baulastenverzeichnis_{KOST}_{YYYY-MM-DD}_Baulast` | 75 |
| Grundriss / Flurkarte | `{KOST}_{YYYY-MM-DD}_{DOKUMENT}` | — |

### Rechnungen
| Dokument | Template | Hinweis |
|---|---|---|
| Rechnung Allgemein | `{OBJEKT}_{LIEFERANT}_{YYYY-MM-DD}_{BETRAG}€` | Objekt · Lieferant · RE-Datum · RE-Nr · Betrag |
| Rechnung Betriebskosten | `{OBJEKT}_{LIEFERANT}_{THEMA}_{YYYY-MM-DD}_{BETRAG}€` | Thema = Strom/Gas/Wasser/Hausmeister |
| Rechnung Umbau/Sanierung | `{OBJEKT}_{LIEFERANT}_{YYYY-MM-DD}_{PROJEKTNR}_{BETRAG}€` | mit Projektnummer aus KPI-Sanierungen |

### Sonstiges
| Dokument | Template |
|---|---|
| Freie Bezeichnung | `{KOST}_{YYYY-MM-DD}_{DOKUMENT}` |

---

## 5. Verknüpfungen / Nutzung im OS

- **PROJEKTNR** wird aus `sanierungen.projektnummer` vorgeschlagen (Datalist) und kann direkt neu hinterlegt werden (legt einen Sanierungs-Eintrag an).
- Die **DMS-Inbox** (`public/dms.html`) verwendet dieselben Vorlagen (`dokument_vorlagen`) für „Benennen & ablegen" — eine gemeinsame Quelle für die Namenssystematik.

## 6. Neue Vorlage anlegen (Beispiel-SQL)

```sql
insert into dokument_vorlagen (kategorie, dokument, template, hinweis, sort, aktiv, bank_nr)
values ('Objektunterlagen', 'Wohnflächenberechnung',
        '{KOST}_{YYYY-MM-DD}_Wohnflächenberechnung', '', 154, true, null);
```

- Nur Tokens aus Abschnitt 2 verwenden — unbekannte `{TOKEN}` erzeugen ein generisches Textfeld ohne Formatregel.
- `aktiv = false` blendet eine Vorlage aus, ohne sie zu löschen.
