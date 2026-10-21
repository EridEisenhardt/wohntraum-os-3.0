// Gemeinsame Hilfen für Zoho Cliq (Anmeldung, Zugang, Aufrufe)
import crypto from 'crypto'

export const DC = () => String(process.env.CLIQ_DC || 'eu').replace(/^\.+/, '')
export const ACCOUNTS = () => 'https://accounts.zoho.' + DC()
export const CLIQ = () => 'https://cliq.zoho.' + DC()
export const SCOPES = 'ZohoCliq.Chats.READ,ZohoCliq.Messages.READ,ZohoCliq.Webhooks.CREATE,ZohoCliq.Channels.READ,ZohoCliq.Users.READ,ZohoCliq.Attachments.READ,AaaServer.profile.Read'
export const bereit = () => !!(process.env.CLIQ_CLIENT_ID && process.env.CLIQ_CLIENT_SECRET)
// feste Rücksprung-Adresse (muss genau so in der Zoho API Console stehen); andere Adresse über CLIQ_REDIRECT möglich
export const rueckkehr = () => process.env.CLIQ_REDIRECT || 'https://os-wohntraumrheinhessen.de/api/cliq/rueckkehr'
export const TEAM = [['Ramona', 'ramona@andersmacher.info'], ['Jürgen', 'juergen@andersmacher.info'], ['Eric', 'eric@andersmacher.info']]

// Konto des Nutzers in Supabase (mit seinem eigenen Zugang, RLS: nur eigene Zeile)
export async function db(pfad, auth, opt = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const r = await fetch(url + '/rest/v1/' + pfad, { method: opt.method || 'GET', headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json', ...(opt.prefer ? { Prefer: opt.prefer } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) throw new Error((j && j.message) || ('Datenbankfehler ' + r.status))
  return j
}
export const konto = async auth => ((await db('cliq_konten?select=*', auth)) || [])[0] || null

// state absichern: Nutzer-ID + Ablauf, signiert
export const sig = s => crypto.createHmac('sha256', process.env.CLIQ_CLIENT_SECRET || 'x').update(s).digest('hex').slice(0, 32)
export const stateNeu = uid => { const s = uid + '.' + (Date.now() + 600e3); return s + '.' + sig(s) }
export const statePruefen = (st, uid) => { const [u, bis, h] = String(st || '').split('.'); return u === uid && Number(bis) > Date.now() && h === sig(u + '.' + bis) }

export async function tokenTausch(params, server) {
  const basis = /^https:\/\/accounts\.zoho\.[a-z.]+$/.test(server || '') ? server : ACCOUNTS()
  const r = await fetch(basis + '/oauth/v2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(Object.assign({ client_id: process.env.CLIQ_CLIENT_ID, client_secret: process.env.CLIQ_CLIENT_SECRET }, params)).toString(), cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.error) throw new Error('Zoho-Anmeldung fehlgeschlagen: ' + (j.error || r.status))
  return j
}
export const CACHE = new Map()
export async function zugang(uid, k) {
  const c = CACHE.get(uid)
  if (c && c.bis > Date.now() && c.rt === k.refresh_token) return c.token
  const j = await tokenTausch({ grant_type: 'refresh_token', refresh_token: k.refresh_token })
  CACHE.set(uid, { token: j.access_token, bis: Date.now() + (Number(j.expires_in || 3600) - 300) * 1000, rt: k.refresh_token })
  return j.access_token
}
export async function cliq(token, pfad, opt = {}) {
  const r = await fetch(CLIQ() + pfad, { method: opt.method || 'GET', headers: { Authorization: 'Zoho-oauthtoken ' + token, Accept: 'application/json', ...(opt.json ? { 'Content-Type': 'application/json' } : {}) }, body: opt.json ? JSON.stringify(opt.json) : undefined, cache: 'no-store' })
  if (r.status === 204) return {}
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {} } catch (e) { }
  if (r.status === 429) throw new Error('Cliq: zu viele Anfragen, bitte kurz warten.')
  if (!r.ok) throw new Error('Cliq: ' + (j.message || r.status))
  return j
}
export const zeit = x => typeof x === 'number' ? x : Date.parse(x || '') || 0
export const text = m => { const c = m.content || {}; if (typeof c === 'string') return c; return c.text || c.comment || (c.file && ('Datei: ' + (c.file.name || ''))) || (m.type === 'file' ? 'Datei' : '') || '' }
export const datei = m => { const c = m.content || {}; const f = c.file || (Array.isArray(c.files) && c.files[0]) || null; if (!f) return null; return { id: f.id || '', name: f.name || 'Datei', typ: f.type || f.content_type || '', groesse: Number(f.size || (f.dimensions && 0) || 0) } }
export const chatKurz = c => ({ id: c.chat_id, name: c.name || c.title || '', typ: c.chat_type || '', geaendert: zeit(c.last_modified_time),
  letzte: c.last_message_info ? { von: (c.last_message_info.sender || {}).name || '', vonId: String((c.last_message_info.sender || {}).id || ''), zeit: zeit(c.last_message_info.time), text: text(c.last_message_info) } : null })
