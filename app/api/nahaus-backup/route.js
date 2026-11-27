// Datensicherung Nahaus (vor der Kündigung): liest Daten über die Nahaus-API (nur GET, nichts wird geändert)
// und legt Daten (JSON) und Dokumente in OneDrive ab: Prozesslandkarte 3.0/30.000 Banken & Dienstleister/Dienstleister/Nahaus/Nahaus Datensicherung 2026-11
// Benötigt in Vercel: NAHAUS_EMAIL und NAHAUS_PASSWORD (oder NAHAUS_TOKEN) sowie MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET.
import { angemeldet, antwort } from '../_lib/auth'
import { graph, graphBereit } from '../_lib/graph'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NROOT = (process.env.NAHAUS_API_URL || 'https://europe-west3-pool-nahaus-de.cloudfunctions.net').replace(/\/+$/, '')
const ZIEL = 'Prozesslandkarte 3.0/30.000 Banken & Dienstleister/Dienstleister/Nahaus/Nahaus Datensicherung 2026-11'
const SITE = () => process.env.MS_SP_SITE || 'andersmacher.sharepoint.com:/sites/WohnTraumRheinhessenGmbH9'
const DATEI_HOST = 'https://firebasestorage.googleapis.com/v0/b/pool-nahaus-de.appspot.com/'
let TOKEN = { wert: '', bis: 0 }, DRIVE = { id: '', bis: 0 }

async function token(neu) {
  if (!process.env.NAHAUS_EMAIL) return process.env.NAHAUS_TOKEN
  if (!neu && TOKEN.wert && Date.now() < TOKEN.bis) return TOKEN.wert
  const r = await fetch(NROOT + '/api-auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.NAHAUS_EMAIL, password: process.env.NAHAUS_PASSWORD }) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('Nahaus-Anmeldung fehlgeschlagen (' + r.status + ').')
  const d = j.data || j
  const wert = d.token || d.idToken || d.accessToken || d.access_token || (typeof d === 'string' ? d : '')
  if (!wert) throw new Error('Nahaus-Anmeldung lieferte keinen Token.')
  TOKEN = { wert, bis: Date.now() + Math.max(300, Number(d.expiresIn || d.expires_in || 3600) - 600) * 1000 }
  return wert
}
async function nh(pfad, query, zweiter) {
  const u = new URL(NROOT + pfad)
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
  const r = await fetch(u, { headers: { authorization: 'Bearer ' + await token(zweiter), accept: 'application/json' }, cache: 'no-store' })
  if ((r.status === 401 || r.status === 403) && !zweiter && process.env.NAHAUS_EMAIL) return nh(pfad, query, true)
  const t = await r.text(); let j = null; try { j = JSON.parse(t) } catch { j = { roh: t.slice(0, 2000) } }
  return { status: r.status, daten: j }
}
async function drive() {
  if (DRIVE.id && Date.now() < DRIVE.bis) return DRIVE.id
  const s = await graph('/sites/' + SITE() + '?$select=id')
  const d = await graph('/sites/' + s.id + '/drive?$select=id')
  DRIVE = { id: d.id, bis: Date.now() + 3600e3 }
  return d.id
}
const enc = p => p.split('/').map(encodeURIComponent).join('/')
const sauber = s => String(s || '').replace(/[\\:*?"<>|#%\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 150) || 'ohne Name'
function zielPfad(rel) {
  const teile = String(rel || '').split('/').filter(Boolean).map(sauber)
  if (!teile.length || teile.some(t => t === '..' || t === '.')) throw new Error('Pfad nicht erlaubt.')
  return ZIEL + '/' + teile.join('/')
}
async function hochladen(rel, bytes, typ) {
  const d = await drive(), p = zielPfad(rel)
  if (bytes.byteLength <= 4 * 1024 * 1024) {
    const r = await graph('/drives/' + d + '/root:/' + enc(p) + ':/content?@microsoft.graph.conflictBehavior=replace', { method: 'PUT', body: bytes, headers: { 'content-type': typ || 'application/octet-stream' } })
    return { id: r.id, size: r.size }
  }
  const s = await graph('/drives/' + d + '/root:/' + enc(p) + ':/createUploadSession', { method: 'POST', json: { item: { '@microsoft.graph.conflictBehavior': 'replace' } } })
  const N = bytes.byteLength, CH = 10 * 320 * 1024; let last = null
  for (let a = 0; a < N; a += CH) {
    const e = Math.min(N, a + CH)
    const r = await fetch(s.uploadUrl, { method: 'PUT', headers: { 'content-length': String(e - a), 'content-range': 'bytes ' + a + '-' + (e - 1) + '/' + N }, body: bytes.slice(a, e) })
    if (!r.ok && r.status !== 202) throw new Error('Upload fehlgeschlagen (' + r.status + ').')
    last = r
  }
  const j = last ? await last.json().catch(() => ({})) : {}
  return { id: j.id, size: j.size || N }
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const b = await req.json().catch(() => ({}))
    if (b.aktion === 'get') {
      const pfad = String(b.pfad || '')
      if (!/^\/(api-v2\/)?[A-Za-z0-9_\-\/]+$/.test(pfad) || pfad.includes('..')) return antwort({ error: 'Pfad nicht erlaubt.' }, 400)
      return antwort(await nh(pfad, b.query || {}))
    }
    const fehlt = graphBereit(); if (fehlt.length) return antwort({ error: 'OneDrive ist nicht verbunden: ' + fehlt.join(', ') })
    if (b.aktion === 'json') {
      const bytes = new TextEncoder().encode(typeof b.inhalt === 'string' ? b.inhalt : JSON.stringify(b.inhalt, null, 1))
      return antwort(await hochladen(b.ziel, bytes, 'application/json'))
    }
    if (b.aktion === 'datei') {
      const url = String(b.url || '')
      if (!url.startsWith(DATEI_HOST)) return antwort({ error: 'Nur Dateien aus dem Nahaus-Speicher.' }, 400)
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) return antwort({ error: 'Datei nicht abrufbar (' + r.status + ').' })
      const bytes = new Uint8Array(await r.arrayBuffer())
      return antwort(await hochladen(b.ziel, bytes, r.headers.get('content-type')))
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) { return antwort({ error: String(e.message || e) }, 500) }
}
