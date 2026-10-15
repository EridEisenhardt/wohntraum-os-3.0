// Asana für das Wohntraum OS: Aufgaben zu einem Mieter suchen, Projekte auflisten, Aufgabe anlegen, erledigen.
// Benötigt in Vercel: ASANA_TOKEN (persönliches Zugriffstoken aus Asana). Optional ASANA_WORKSPACE.
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const WS = () => process.env.ASANA_WORKSPACE || '1206683226417804'
const FELDER = 'name,completed,completed_at,due_on,assignee.name,projects.name,memberships.section.name,permalink_url,modified_at,notes'
let PROJ = { list: null, bis: 0 }

async function asana(pfad, opt = {}) {
  const r = await fetch('https://app.asana.com/api/1.0' + pfad, {
    method: opt.method || 'GET',
    headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN, Accept: 'application/json', ...(opt.json ? { 'Content-Type': 'application/json' } : {}) },
    body: opt.json ? JSON.stringify({ data: opt.json }) : undefined,
    cache: 'no-store'
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || ('Asana-Fehler ' + r.status))
  return j.data
}
const aufgabe = t => ({
  gid: t.gid, name: t.name, erledigt: !!t.completed, erledigtAm: t.completed_at || '', faellig: t.due_on || '',
  zustaendig: (t.assignee && t.assignee.name) || '', projekte: (t.projects || []).map(p => p.name),
  abschnitt: ((t.memberships || []).find(m => m.section) || {}).section?.name || '',
  link: t.permalink_url || ('https://app.asana.com/0/0/' + t.gid), geaendert: t.modified_at || '', notiz: String(t.notes || '').slice(0, 400)
})

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    if (!process.env.ASANA_TOKEN) return antwort({ error: 'Asana ist noch nicht verbunden. In Vercel fehlt: ASANA_TOKEN', setup: true })
    const b = await req.json().catch(() => ({}))
    const a = b.aktion

    if (a === 'suche') {
      // mehrere Suchbegriffe (z. B. Nachname, "M8 WE11"), Ergebnisse zusammenführen
      const begriffe = [...new Set((b.begriffe || []).map(s => String(s || '').trim()).filter(s => s.length >= 3))].slice(0, 4)
      const out = new Map()
      for (const text of begriffe) {
        for (const erledigt of [false, true]) {
          const q = new URLSearchParams({ text, opt_fields: FELDER, sort_by: 'modified_at', limit: erledigt ? '15' : '50', completed: String(erledigt) })
          const L = await asana('/workspaces/' + WS() + '/tasks/search?' + q.toString())
          for (const t of L || []) out.set(t.gid, aufgabe(t))
        }
      }
      return antwort({ aufgaben: [...out.values()] })
    }

    if (a === 'projekte') {
      if (!PROJ.list || Date.now() > PROJ.bis) {
        let L = [], off = ''
        for (let i = 0; i < 10; i++) {
          const q = new URLSearchParams({ workspace: WS(), archived: 'false', limit: '100', opt_fields: 'name' }); if (off) q.set('offset', off)
          const r = await fetch('https://app.asana.com/api/1.0/projects?' + q, { headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN }, cache: 'no-store' })
          const j = await r.json(); if (!r.ok) throw new Error('Asana-Fehler ' + r.status)
          L = L.concat((j.data || []).map(p => ({ gid: p.gid, name: p.name })))
          off = j.next_page && j.next_page.offset; if (!off) break
        }
        PROJ = { list: L.sort((x, y) => x.name.localeCompare(y.name, 'de')), bis: Date.now() + 600e3 }
      }
      return antwort({ projekte: PROJ.list })
    }

    if (a === 'nutzer') {
      const L = await asana('/workspaces/' + WS() + '/users?opt_fields=name,email&limit=100')
      return antwort({ nutzer: (L || []).map(u => ({ gid: u.gid, name: u.name, email: u.email || '' })).sort((x, y) => String(x.name).localeCompare(String(y.name), 'de')) })
    }

    if (a === 'anlegen') {
      const name = String(b.name || '').trim(); if (!name) return antwort({ error: 'Bitte einen Titel eingeben.' }, 400)
      const d = { name, workspace: WS(), notes: String(b.notiz || '') }
      if (b.projekt) d.projects = [String(b.projekt)]
      if (/^\d{4}-\d\d-\d\d$/.test(b.faellig || '')) d.due_on = b.faellig
      if (b.zustaendig) d.assignee = String(b.zustaendig)
      const t = await asana('/tasks?opt_fields=' + FELDER, { method: 'POST', json: d })
      return antwort({ aufgabe: aufgabe(t) })
    }

    if (a === 'erledigt') {
      const t = await asana('/tasks/' + encodeURIComponent(b.gid) + '?opt_fields=' + FELDER, { method: 'PUT', json: { completed: !!b.wert } })
      return antwort({ aufgabe: aufgabe(t) })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: e.message || String(e) }, 500)
  }
}
