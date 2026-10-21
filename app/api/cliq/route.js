// Zoho Cliq im Wohntraum OS: jeder Nutzer verbindet sein eigenes Cliq-Konto (OAuth), danach Chats lesen und schreiben.
// Benötigt in Vercel: CLIQ_CLIENT_ID, CLIQ_CLIENT_SECRET, optional CLIQ_DC (Standard: eu für zoho.eu)
// Weiterleitungs-URL in der Zoho API Console: https://<OS-Domain>/api/cliq/rueckkehr
import crypto from 'crypto'
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'

const DC = () => String(process.env.CLIQ_DC || 'eu').replace(/^\.+/, '')
const ACCOUNTS = () => 'https://accounts.zoho.' + DC()
const CLIQ = () => 'https://cliq.zoho.' + DC()
const SCOPES = 'ZohoCliq.Chats.READ,ZohoCliq.Messages.READ,ZohoCliq.Webhooks.CREATE,ZohoCliq.Channels.READ,ZohoCliq.Users.READ,AaaServer.profile.Read'
const bereit = () => !!(process.env.CLIQ_CLIENT_ID && process.env.CLIQ_CLIENT_SECRET)
// feste Rücksprung-Adresse (muss genau so in der Zoho API Console stehen); andere Adresse über CLIQ_REDIRECT möglich
const rueckkehr = () => process.env.CLIQ_REDIRECT || 'https://os-wohntraumrheinhessen.de/api/cliq/rueckkehr'
const TEAM = [['Ramona', 'ramona@andersmacher.info'], ['Jürgen', 'juergen@andersmacher.info'], ['Eric', 'eric@andersmacher.info']]

// Konto des Nutzers in Supabase (mit seinem eigenen Zugang, RLS: nur eigene Zeile)
async function db(pfad, auth, opt = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const r = await fetch(url + '/rest/v1/' + pfad, { method: opt.method || 'GET', headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json', ...(opt.prefer ? { Prefer: opt.prefer } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) throw new Error((j && j.message) || ('Datenbankfehler ' + r.status))
  return j
}
const konto = async auth => ((await db('cliq_konten?select=*', auth)) || [])[0] || null

// state absichern: Nutzer-ID + Ablauf, signiert
const sig = s => crypto.createHmac('sha256', process.env.CLIQ_CLIENT_SECRET || 'x').update(s).digest('hex').slice(0, 32)
const stateNeu = uid => { const s = uid + '.' + (Date.now() + 600e3); return s + '.' + sig(s) }
const statePruefen = (st, uid) => { const [u, bis, h] = String(st || '').split('.'); return u === uid && Number(bis) > Date.now() && h === sig(u + '.' + bis) }

async function tokenTausch(params, server) {
  const basis = /^https:\/\/accounts\.zoho\.[a-z.]+$/.test(server || '') ? server : ACCOUNTS()
  const r = await fetch(basis + '/oauth/v2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(Object.assign({ client_id: process.env.CLIQ_CLIENT_ID, client_secret: process.env.CLIQ_CLIENT_SECRET }, params)).toString(), cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.error) throw new Error('Zoho-Anmeldung fehlgeschlagen: ' + (j.error || r.status))
  return j
}
const CACHE = new Map()
async function zugang(uid, k) {
  const c = CACHE.get(uid)
  if (c && c.bis > Date.now() && c.rt === k.refresh_token) return c.token
  const j = await tokenTausch({ grant_type: 'refresh_token', refresh_token: k.refresh_token })
  CACHE.set(uid, { token: j.access_token, bis: Date.now() + (Number(j.expires_in || 3600) - 300) * 1000, rt: k.refresh_token })
  return j.access_token
}
async function cliq(token, pfad, opt = {}) {
  const r = await fetch(CLIQ() + pfad, { method: opt.method || 'GET', headers: { Authorization: 'Zoho-oauthtoken ' + token, Accept: 'application/json', ...(opt.json ? { 'Content-Type': 'application/json' } : {}) }, body: opt.json ? JSON.stringify(opt.json) : undefined, cache: 'no-store' })
  if (r.status === 204) return {}
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {} } catch (e) { }
  if (r.status === 429) throw new Error('Cliq: zu viele Anfragen, bitte kurz warten.')
  if (!r.ok) throw new Error('Cliq: ' + (j.message || r.status))
  return j
}
const zeit = x => typeof x === 'number' ? x : Date.parse(x || '') || 0
const text = m => { const c = m.content || {}; if (typeof c === 'string') return c; return c.text || c.comment || (c.file && ('Datei: ' + (c.file.name || ''))) || (m.type === 'file' ? 'Datei' : '') || '' }
const chatKurz = c => ({ id: c.chat_id, name: c.name || c.title || '', typ: c.chat_type || '', geaendert: zeit(c.last_modified_time),
  letzte: c.last_message_info ? { von: (c.last_message_info.sender || {}).name || '', vonId: String((c.last_message_info.sender || {}).id || ''), zeit: zeit(c.last_message_info.time), text: text(c.last_message_info) } : null })

export async function POST(req) {
  try {
    const user = await angemeldet(req)
    if (!user) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const auth = req.headers.get('authorization')
    const b = await req.json().catch(() => ({}))
    const a = b.aktion

    if (a === 'status') {
      if (!bereit()) return antwort({ eingerichtet: false, verbunden: false, rueckkehr: rueckkehr() })
      const k = await konto(auth)
      return antwort({ eingerichtet: true, rueckkehr: rueckkehr(), client: String(process.env.CLIQ_CLIENT_ID || '').slice(0, 8), dc: DC(), verbunden: !!k, name: k && k.zoho_name, mail: k && k.zoho_mail, id: k && k.zoho_id })
    }
    if (!bereit()) return antwort({ error: 'Cliq ist noch nicht eingerichtet (CLIQ_CLIENT_ID und CLIQ_CLIENT_SECRET fehlen in Vercel).' }, 400)

    if (a === 'verbinden') {
      const p = new URLSearchParams({ scope: SCOPES, client_id: process.env.CLIQ_CLIENT_ID, response_type: 'code', access_type: 'offline', prompt: 'consent', redirect_uri: rueckkehr(req), state: stateNeu(user.id) })
      return antwort({ url: ACCOUNTS() + '/oauth/v2/auth?' + p.toString() })
    }
    if (a === 'code') {
      if (!statePruefen(b.state, user.id)) return antwort({ error: 'Die Anmeldung ist abgelaufen. Bitte noch einmal verbinden.' }, 400)
      const j = await tokenTausch({ grant_type: 'authorization_code', code: String(b.code || ''), redirect_uri: rueckkehr(req) }, b.server)
      if (!j.refresh_token) throw new Error('Zoho hat keinen dauerhaften Zugang geliefert. Bitte noch einmal verbinden.')
      let info = {}
      try { const r = await fetch((b.server && /^https:\/\/accounts\.zoho\.[a-z.]+$/.test(b.server) ? b.server : ACCOUNTS()) + '/oauth/user/info', { headers: { Authorization: 'Zoho-oauthtoken ' + j.access_token }, cache: 'no-store' }); info = await r.json() } catch (e) { }
      await db('cliq_konten?on_conflict=user_id', auth, { method: 'POST', prefer: 'resolution=merge-duplicates', body: { user_id: user.id, refresh_token: j.refresh_token, api_domain: j.api_domain || null, zoho_name: info.Display_Name || [info.First_Name, info.Last_Name].filter(Boolean).join(' ') || null, zoho_mail: info.Email || null, zoho_id: info.ZUID ? String(info.ZUID) : null, updated_at: new Date().toISOString() } })
      CACHE.delete(user.id)
      return antwort({ ok: true, name: info.Display_Name || '' })
    }
    if (a === 'trennen') {
      const k = await konto(auth)
      if (k) { try { await fetch(ACCOUNTS() + '/oauth/v2/token/revoke?token=' + encodeURIComponent(k.refresh_token), { method: 'POST' }) } catch (e) { } }
      await db('cliq_konten?user_id=eq.' + user.id, auth, { method: 'DELETE' })
      CACHE.delete(user.id)
      return antwort({ ok: true })
    }

    const k = await konto(auth)
    if (!k) return antwort({ error: 'Dein Cliq-Konto ist noch nicht mit dem OS verbunden.', verbinden: true }, 400)
    const token = await zugang(user.id, k)

    if (a === 'chats') {
      const j = await cliq(token, '/api/v2/chats?limit=' + Math.min(Number(b.anzahl) || 50, 100))
      return antwort({ chats: (j.chats || j.data || []).map(chatKurz).sort((x, y) => (y.letzte ? y.letzte.zeit : y.geaendert) - (x.letzte ? x.letzte.zeit : x.geaendert)), ich: k.zoho_id || '' })
    }
    if (a === 'nachrichten') {
      const id = encodeURIComponent(String(b.chat || ''))
      const q = new URLSearchParams({ limit: String(Math.min(Number(b.anzahl) || 50, 100)) }); if (b.bis) q.set('totime', String(b.bis))
      const j = await cliq(token, '/api/v2/chats/' + id + '/messages?' + q.toString())
      const L = (j.data || []).map(m => ({ id: m.id, von: (m.sender || {}).name || '', vonId: String((m.sender || {}).id || ''), zeit: zeit(m.time), typ: m.type || 'text', text: text(m) })).sort((x, y) => x.zeit - y.zeit)
      return antwort({ nachrichten: L, ich: k.zoho_id || '' })
    }
    if (a === 'senden') {
      const t = String(b.text || '').trim().slice(0, 5000); if (!t) return antwort({ error: 'Kein Text.' }, 400)
      let pfad
      if (b.chat) pfad = '/api/v2/chats/' + encodeURIComponent(String(b.chat)) + '/message'
      else if (b.kanal) pfad = '/api/v2/channelsbyname/' + encodeURIComponent(String(b.kanal)) + '/message'
      else if (b.an) pfad = '/api/v2/buddies/' + encodeURIComponent(String(b.an)) + '/message'
      else return antwort({ error: 'Empfänger fehlt.' }, 400)
      const j = await cliq(token, pfad, { method: 'POST', json: { text: t, sync_message: true } })
      return antwort({ ok: true, id: j.message_id || '' })
    }
    if (a === 'ziele') {
      let kanaele = []
      try { const j = await cliq(token, '/api/v2/channels?joined=true&limit=100'); kanaele = (j.channels || j.data || []).map(c => ({ name: c.name || '', kanal: c.unique_name || '', chat: c.chat_id || '' })).filter(c => c.kanal || c.chat) } catch (e) { }
      const ich = String(k.zoho_mail || user.email || '').toLowerCase()
      return antwort({ personen: TEAM.filter(([, m]) => m !== ich).map(([name, mail]) => ({ name, mail })), kanaele })
    }
    if (a === 'neu') {
      const seit = Number(b.seit) || (Date.now() - 600e3)
      const j = await cliq(token, '/api/v2/chats?limit=50&modified_after=' + seit)
      const L = (j.chats || j.data || []).map(chatKurz).filter(c => c.letzte && c.letzte.zeit > seit && c.letzte.vonId !== String(k.zoho_id || ''))
      return antwort({ neu: L, jetzt: Date.now() })
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
