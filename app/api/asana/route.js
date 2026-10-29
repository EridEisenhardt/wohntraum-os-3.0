// Asana für das Wohntraum OS: Aufgaben zu einem Mieter suchen, Projekte auflisten, Aufgabe anlegen, erledigen.
// Benötigt in Vercel: ASANA_TOKEN (persönliches Zugriffstoken aus Asana). Optional ASANA_WORKSPACE.
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const WS = () => process.env.ASANA_WORKSPACE || '1206683226417804'
const FELDER = 'tags.name,name,completed,completed_at,due_on,assignee.name,projects.name,memberships.section.name,permalink_url,modified_at,notes'
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
  tags: (t.tags || []).map(x => x.name),
  link: t.permalink_url || ('https://app.asana.com/0/0/' + t.gid), geaendert: t.modified_at || '', notiz: String(t.notes || '').slice(0, 400)
})

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    if (!process.env.ASANA_TOKEN) return antwort({ error: 'Asana ist noch nicht verbunden. In Vercel fehlt: ASANA_TOKEN', setup: true })
    // Datei an eine Aufgabe anhängen (multipart: gid + datei), max. ca. 4 MB je Datei
    if ((req.headers.get('content-type') || '').includes('multipart/form-data')) {
      const fd = await req.formData(); const gid = String(fd.get('gid') || ''); const f = fd.get('datei')
      if (!gid || !f || typeof f === 'string') return antwort({ error: 'Datei oder Aufgabe fehlt.' }, 400)
      const out = new FormData(); out.append('parent', gid); out.append('file', f, f.name || 'Datei')
      const r = await fetch('https://app.asana.com/api/1.0/attachments', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN }, body: out })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || ('Asana-Fehler ' + r.status))
      return antwort({ ok: true, name: j.data && j.data.name })
    }
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

    if (a === 'tags') {
      let L = [], off = ''
      for (let i = 0; i < 10; i++) {
        const q = new URLSearchParams({ limit: '100', opt_fields: 'name' }); if (off) q.set('offset', off)
        const r = await fetch('https://app.asana.com/api/1.0/workspaces/' + WS() + '/tags?' + q, { headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN }, cache: 'no-store' })
        const j = await r.json(); if (!r.ok) throw new Error('Asana-Fehler ' + r.status)
        L = L.concat((j.data || []).map(t => ({ gid: t.gid, name: t.name })))
        off = j.next_page && j.next_page.offset; if (!off) break
      }
      return antwort({ tags: L.sort((x, y) => String(x.name).localeCompare(String(y.name), 'de')) })
    }

    if (a === 'unterReihenfolge') {
      // Unteraufgaben einer Aufgabe in die angegebene Reihenfolge bringen
      const parent = String(b.parent || ''), L = (b.gids || []).map(String).filter(g => /^\d+$/.test(g)).slice(0, 50)
      if (!/^\d+$/.test(parent) || !L.length) return antwort({ error: 'Aufgabe fehlt.' }, 400)
      await asana('/tasks/' + L[0] + '/setParent', { method: 'POST', json: { parent, insert_before: null } }).catch(() => asana('/tasks/' + L[0] + '/setParent', { method: 'POST', json: { parent } }))
      for (let i = 1; i < L.length; i++) await asana('/tasks/' + L[i] + '/setParent', { method: 'POST', json: { parent, insert_after: L[i - 1] } })
      return antwort({ ok: true, anzahl: L.length })
    }

    if (a === 'abschnittSicher') {
      // Abschnitt eines Projekts nach Namen suchen, sonst anlegen (z. B. „Schadenersatz“ in „Mieter Meldungen“)
      const p = String(b.projekt || ''), n = String(b.name || '').trim(); if (!/^\d+$/.test(p) || !n) return antwort({ error: 'Projekt oder Name fehlt.' }, 400)
      const L = await asana('/projects/' + p + '/sections?opt_fields=name&limit=100')
      let x = (L || []).find(y => String(y.name).trim().toLowerCase() === n.toLowerCase())
      if (!x) x = await asana('/projects/' + p + '/sections', { method: 'POST', json: { name: n } })
      return antwort({ abschnitt: { gid: x.gid, name: x.name } })
    }

    if (a === 'anlegen') {
      const name = String(b.name || '').trim(); if (!name) return antwort({ error: 'Bitte einen Titel eingeben.' }, 400)
      const d = { name, workspace: WS(), notes: String(b.notiz || '') }
      if (b.projekt && b.abschnitt) d.memberships = [{ project: String(b.projekt), section: String(b.abschnitt) }]
      else if (b.projekt) d.projects = [String(b.projekt)]
      if (/^\d{4}-\d\d-\d\d$/.test(b.faellig || '')) d.due_on = b.faellig
      if (b.zustaendig) d.assignee = String(b.zustaendig)
      // Tags: vorhandene per gid, neue per Name (werden in Asana angelegt)
      const tags = []
      for (const t of (b.tags || []).slice(0, 10)) {
        if (t && t.gid) tags.push(String(t.gid))
        else if (t && String(t.name || '').trim()) { const n = await asana('/workspaces/' + WS() + '/tags', { method: 'POST', json: { name: String(t.name).trim() } }); tags.push(n.gid) }
      }
      if (tags.length) d.tags = tags
      const t = await asana('/tasks?opt_fields=' + FELDER, { method: 'POST', json: d })
      // Unteraufgaben (z. B. Schadenersatz: Geltendmachung, Rechnungen, Inrechnungstellung)
      const unter = []
      for (const n of (b.unteraufgaben || []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 20)) {
        const u = await asana('/tasks/' + t.gid + '/subtasks?opt_fields=name', { method: 'POST', json: Object.assign({ name: n }, b.zustaendig ? { assignee: String(b.zustaendig) } : {}) })
        unter.push({ gid: u.gid, name: u.name })
      }
      return antwort({ aufgabe: aufgabe(t), unteraufgaben: unter })
    }

    if (a === 'status') {
      // Stand mehrerer Aufgaben (z. B. Störungsmeldungen): erledigt und Abschnitt
      const out = {}
      for (const gid of (b.gids || []).map(String).filter(g => /^\d+$/.test(g)).slice(0, 60)) {
        try { const t = await asana('/tasks/' + gid + '?opt_fields=' + FELDER); out[gid] = aufgabe(t) } catch (e) { out[gid] = { fehler: e.message } }
      }
      return antwort({ aufgaben: out })
    }

    if (a === 'abschnitt') {
      // Aufgabe in einen Abschnitt verschieben (z. B. Eingang, In Arbeit, Erledigt)
      await asana('/sections/' + encodeURIComponent(b.abschnitt) + '/addTask', { method: 'POST', json: { task: String(b.gid) } })
      if (b.erledigt !== undefined) await asana('/tasks/' + encodeURIComponent(b.gid), { method: 'PUT', json: { completed: !!b.erledigt } })
      return antwort({ ok: true })
    }

    if (a === 'aktualisieren') {
      // Zuständige Person und Fälligkeit einer Aufgabe ändern (leer = entfernen)
      const d = {}
      if (b.zustaendig !== undefined) d.assignee = b.zustaendig ? String(b.zustaendig) : null
      if (b.faellig !== undefined) d.due_on = /^\d{4}-\d\d-\d\d$/.test(b.faellig || '') ? b.faellig : null
      const t = await asana('/tasks/' + encodeURIComponent(b.gid) + '?opt_fields=' + FELDER, { method: 'PUT', json: d })
      return antwort({ aufgabe: aufgabe(t) })
    }

    if (a === 'kommentar') {
      const text = String(b.text || '').trim(); if (!text) return antwort({ error: 'Kommentar fehlt.' }, 400)
      await asana('/tasks/' + encodeURIComponent(b.gid) + '/stories', { method: 'POST', json: { text } })
      return antwort({ ok: true })
    }

    if (a === 'erledigt') {
      const t = await asana('/tasks/' + encodeURIComponent(b.gid) + '?opt_fields=' + FELDER, { method: 'PUT', json: { completed: !!b.wert } })
      return antwort({ aufgabe: aufgabe(t) })
    }

    if (a === 'import') {
      // Eine Asana-Aufgabe (per Link oder ID) ins Wohntraum OS übertragen: Aufgabe + Unteraufgaben + Kommentare.
      // Danach wird die Aufgabe in Asana mit dem Tag „WohntraumOS-Übertragen“ markiert.
      const raw = String(b.link || '').trim()
      const gid = (raw.match(/\/task\/(\d+)/) || [])[1] || (raw.match(/\d{6,}/g) || []).pop()
      if (!gid) return antwort({ error: 'Kein gültiger Asana-Link bzw. keine Aufgaben-ID gefunden.' }, 400)
      const t = await asana('/tasks/' + gid + '?opt_fields=name,notes,due_on,completed,assignee.name,permalink_url')
      const subs = (await asana('/tasks/' + gid + '/subtasks?opt_fields=name,completed,due_on&limit=100')) || []
      const stories = (await asana('/tasks/' + gid + '/stories?opt_fields=text,type,created_at,created_by.name&limit=100')) || []
      const kommentare = stories.filter(s => s.type === 'comment').map(s => ({ text: String(s.text || ''), autor: (s.created_by && s.created_by.name) || '', created_at: s.created_at || '' }))
      let getaggt = false
      try {
        const TAG = 'WohntraumOS-Übertragen'
        let found = null, off = ''
        for (let i = 0; i < 10; i++) {
          const q = new URLSearchParams({ limit: '100', opt_fields: 'name' }); if (off) q.set('offset', off)
          const r = await fetch('https://app.asana.com/api/1.0/workspaces/' + WS() + '/tags?' + q, { headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN }, cache: 'no-store' })
          const j = await r.json(); if (!r.ok) break
          found = (j.data || []).find(x => String(x.name).trim().toLowerCase() === TAG.toLowerCase()); if (found) break
          off = j.next_page && j.next_page.offset; if (!off) break
        }
        const tagGid = found ? found.gid : (await asana('/workspaces/' + WS() + '/tags', { method: 'POST', json: { name: TAG } })).gid
        await asana('/tasks/' + gid + '/addTag', { method: 'POST', json: { tag: tagGid } })
        getaggt = true
      } catch (e) { /* Tag setzen ist optional – Übertragung bleibt gültig */ }
      return antwort({
        task: { gid, name: t.name || '', notiz: String(t.notes || ''), faellig: t.due_on || '', zustaendig: (t.assignee && t.assignee.name) || '', completed: !!t.completed, link: t.permalink_url || raw },
        unteraufgaben: subs.map(s => ({ name: s.name || '', erledigt: !!s.completed, faellig: s.due_on || '' })),
        kommentare, getaggt
      })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: e.message || String(e) }, 500)
  }
}
