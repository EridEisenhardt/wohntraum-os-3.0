// KI-Textfunktionen: Anschreiben formulieren, Notizen verbessern oder in Stichpunkte kürzen.
// Benötigt die Umgebungsvariable ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL).
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'

const STIL = 'Du arbeitest für die Hausverwaltung Wohn(T)raum Rheinhessen. Schreibe auf Deutsch, sachlich, freundlich und klar. ' +
  'Erfinde keine Fakten, Daten, Beträge oder Zusagen. Fehlt eine Angabe, setze einen Platzhalter in eckigen Klammern, z. B. [Datum].'

const AUFGABEN = {
  brief: STIL + ' Aufgabe: Formuliere aus dem Entwurf einen Brief an einen Mieter (Sie-Form). ' +
    'Beginne mit der vorgegebenen Anrede, dann der Brieftext in Absätzen (durch Leerzeilen getrennt). ' +
    'Keine Grußformel, keine Unterschrift, kein Briefkopf, kein Datum, keine Adresse – das ergänzt das System. ' +
    'Antworte ausschließlich als JSON: {"betreff": "kurzer Betreff ohne das Wort Betreff", "text": "Brieftext"}.',
  verbessern: STIL + ' Aufgabe: Verbessere die folgende interne Notiz: Rechtschreibung, Grammatik, verständliche Sätze. ' +
    'Inhalt, Namen, Daten und Beträge unverändert lassen, nichts hinzufügen. Antworte nur mit dem verbesserten Text.',
  stichpunkte: STIL + ' Aufgabe: Fasse die folgende interne Notiz in kurzen Stichpunkten zusammen (jede Zeile beginnt mit "- "). ' +
    'Alle wichtigen Fakten behalten: Namen, Daten, Beträge, Vereinbarungen, offene Aufgaben. Höchstens 8 Stichpunkte. Antworte nur mit den Stichpunkten.',
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return antwort({ error: 'Die KI ist noch nicht eingerichtet (API-Schlüssel fehlt).', setup: true })
    const body = await req.json().catch(() => ({}))
    const aufgabe = String(body.aufgabe || '')
    const text = String(body.text || '').slice(0, 20000)
    if (!AUFGABEN[aufgabe]) return antwort({ error: 'Unbekannte Aufgabe.' }, 400)
    if (!text.trim()) return antwort({ error: 'Kein Text übergeben.' }, 400)
    const k = body.kontext || {}
    let content = text
    if (aufgabe === 'brief') {
      content = 'Anrede: ' + (k.anrede || 'Sehr geehrte Damen und Herren,') + '\nMieter: ' + (k.mieter || '') + '\nObjekt: ' + (k.objekt || '') +
        (k.betreff ? '\nBetreff-Vorschlag: ' + k.betreff : '') + '\n\nEntwurf:\n' + text
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 2000, system: AUFGABEN[aufgabe], messages: [{ role: 'user', content }] }),
    })
    const j = await r.json()
    if (!r.ok) return antwort({ error: 'KI-Fehler: ' + ((j && j.error && j.error.message) || r.status) })
    const out = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim()
    if (aufgabe === 'brief') {
      const m = out.match(/\{[\s\S]*\}/)
      try { const o = JSON.parse(m ? m[0] : out); return antwort({ betreff: String(o.betreff || k.betreff || ''), text: String(o.text || '') }) }
      catch { return antwort({ betreff: k.betreff || '', text: out }) }
    }
    return antwort({ text: out })
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
