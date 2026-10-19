// Öffentliche Schnittstelle für Störungsmeldungen (ohne Anmeldung):
// - aktion 'asana': Meldung aus dem Mieter-Formular als Asana-Aufgabe im Projekt „Mieter Meldungen“ (Abschnitt Eingang) anlegen
// - aktion 'rueckmeldung': Rückmeldung eines Handwerkers als Kommentar an die Asana-Aufgabe hängen
// Geprüft wird über die Datenbankfunktionen (Link-Token), Schreibrechte hat nur der Server mit ASANA_TOKEN.
import { antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const PROJEKT = '1211451233949578', EINGANG = '1211451233949579'
const BUCKET = () => process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/stoerungen/'

async function rpc(fn, args) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const r = await fetch(url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(args), cache: 'no-store' })
  const j = await r.json().catch(() => null)
  if (!r.ok) throw new Error((j && j.message) || ('Datenbankfehler ' + r.status))
  return j
}
async function asana(pfad, json) {
  const r = await fetch('https://app.asana.com/api/1.0' + pfad, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ data: json }), cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || ('Asana-Fehler ' + r.status))
  return j.data
}

export async function POST(req) {
  try {
    if (!process.env.ASANA_TOKEN) return antwort({ ok: false, hinweis: 'Asana nicht verbunden' })
    const b = await req.json().catch(() => ({}))

    if (b.aktion === 'asana') {
      const d = await rpc('stoerung_fuer_asana', { p_id: String(b.id || ''), p_token: String(b.token || '') })
      if (!d) return antwort({ ok: false })
      const name = [d.kz, d.einheit, d.titel].filter(Boolean).join('_').replace(/\s*_\s*/g, '_')
      const fotos = (d.fotos || []).map(f => '- ' + (f.name || 'Foto') + ': ' + BUCKET() + f.pfad).join('\n')
      const notes = [(d.dringlichkeit && d.dringlichkeit !== 'Normal' ? 'DRINGLICHKEIT: ' + d.dringlichkeit + '\n' : '') + (d.beschreibung || ''),
        'Objekt: ' + d.kz + ' · ' + (d.adresse || '') + (d.einheit ? ' · ' + d.einheit : ''),
        'Kategorie: ' + (d.kategorie || '–'), 'Gemeldet von: ' + (d.melder || '–') + (d.kontakt ? ' · ' + d.kontakt : ''),
        fotos ? 'Fotos:\n' + fotos : '', 'Störung Nr. ' + d.nr + ' · über das Mieter-Formular im Wohntraum OS gemeldet'].filter(Boolean).join('\n\n')
      const t = await asana('/tasks?opt_fields=permalink_url', { name, notes, workspace: process.env.ASANA_WORKSPACE || '1206683226417804', memberships: [{ project: PROJEKT, section: EINGANG }] })
      await rpc('stoerung_asana_setzen', { p_id: String(b.id), p_token: String(b.token), p_gid: t.gid, p_link: t.permalink_url || '' })
      return antwort({ ok: true })
    }

    if (b.aktion === 'rueckmeldung') {
      const d = await rpc('stoerung_hw', { p_token: String(b.token || '') })
      if (!d || !d.asana_gid) return antwort({ ok: false })
      const fotos = (b.fotos || []).filter(f => f && /^meldungen\//.test(f.pfad || '')).slice(0, 10).map(f => '- ' + (f.name || 'Foto') + ': ' + BUCKET() + f.pfad).join('\n')
      const text = 'Rückmeldung ' + (String(b.name || '').slice(0, 120) || 'Handwerker') + (b.erledigt ? ' (als erledigt gemeldet)' : '') + ':\n' + String(b.text || '').slice(0, 4000) + (fotos ? '\n\nFotos:\n' + fotos : '')
      await asana('/tasks/' + encodeURIComponent(d.asana_gid) + '/stories', { text })
      return antwort({ ok: true })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ ok: false, error: e.message || String(e) }, 500)
  }
}
