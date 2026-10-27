// Bankanbindung des Wohntraum OS über Enable Banking (Kontoinformationsdienst nach PSD2).
// Benötigt in Vercel: ENABLEBANKING_APP_ID und ENABLEBANKING_PRIVATE_KEY (Inhalt der .pem-Datei).
// Aktionen (angemeldet):
//   status            – ist der Zugang eingetragen, welche Bankverbindungen bestehen
//   banken            – Banken in Deutschland (für die Auswahl „Bank verbinden“)
//   verbinden         – startet die Freigabe bei der Bank, liefert die Adresse für die Anmeldung
//   sitzung           – nach der Rückkehr von der Bank: Verbindung mit dem Code anlegen und speichern
//   trennen           – Verbindung im OS entfernen
//   konten            – alle verbundenen Konten mit Kontostand (gleiche Form wie /api/nahaus)
//   umsaetze          – Umsätze eines Kontos ab Datum (gleiche Form wie /api/nahaus)
// Die Zugangsdaten zur Bank sieht das OS nie; gespeichert werden nur die Verbindungs-IDs (os_docs bank/verbindungen).
import crypto from 'crypto'
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const API = 'https://api.enablebanking.com'
const fehlt = () => ['ENABLEBANKING_APP_ID', 'ENABLEBANKING_PRIVATE_KEY'].filter(k => !process.env[k])
const b64u = x => Buffer.from(x).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
// Schlüssel robust lesen: mit oder ohne BEGIN/END-Zeilen, mit Leerzeichen statt Zeilenumbrüchen, mit \n, base64-kodiert
let KEY = null
function schluessel() {
  if (KEY) return KEY
  let roh = String(process.env.ENABLEBANKING_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')
  if (!/BEGIN/.test(roh) && /^[A-Za-z0-9+/=\s]+$/.test(roh)) { try { const d = Buffer.from(roh.replace(/\s+/g, ''), 'base64').toString('utf8'); if (/BEGIN/.test(d)) roh = d } catch (e) { } }
  const versuche = []
  const m = roh.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/)
  if (m) { const kern = m[2].replace(/[^A-Za-z0-9+/=]/g, ''); versuche.push('-----BEGIN ' + m[1] + '-----\n' + kern.match(/.{1,64}/g).join('\n') + '\n-----END ' + m[1] + '-----\n') }
  const kern = roh.replace(/-----[^-]+-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '')
  if (kern) { versuche.push({ key: Buffer.from(kern, 'base64'), format: 'der', type: 'pkcs8' }, { key: Buffer.from(kern, 'base64'), format: 'der', type: 'pkcs1' }) }
  for (const v of versuche) { try { KEY = crypto.createPrivateKey(v); return KEY } catch (e) { } }
  throw new Error('Der private Schlüssel in Vercel (ENABLEBANKING_PRIVATE_KEY) lässt sich nicht lesen. Bitte den kompletten Inhalt der .pem-Datei inklusive der Zeilen BEGIN und END eintragen.')
}
function jwt() {
  const jetzt = Math.floor(Date.now() / 1000)
  const kopf = b64u(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: process.env.ENABLEBANKING_APP_ID }))
  const inhalt = b64u(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: jetzt, exp: jetzt + 3600 }))
  const sig = crypto.createSign('RSA-SHA256').update(kopf + '.' + inhalt).sign(schluessel())
  return kopf + '.' + inhalt + '.' + b64u(sig)
}
async function eb(pfad, opt = {}) {
  const r = await fetch(API + pfad, { method: opt.method || 'GET', headers: { authorization: 'Bearer ' + jwt(), 'content-type': 'application/json', accept: 'application/json' }, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) { const m = j && (j.message || j.detail || j.error) || t.slice(0, 200); const e = new Error('Enable Banking (' + r.status + '): ' + (typeof m === 'string' ? m : JSON.stringify(m))); e.status = r.status; throw e }
  return j
}
// Supabase mit dem Token des angemeldeten Nutzers (RLS wie im übrigen OS)
async function db(pfad, opt = {}, auth) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const r = await fetch(url + '/rest/v1/' + pfad, { method: opt.method || 'GET', headers: { apikey: key, Authorization: auth, 'Content-Type': 'application/json', ...(opt.prefer ? { Prefer: opt.prefer } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) throw new Error((j && j.message) || ('Datenbankfehler ' + r.status))
  return j
}
const PFAD = 'bank/verbindungen'
async function laden(auth) { const r = await db('os_docs?select=data&app=eq.oc&pfad=eq.' + encodeURIComponent(PFAD), {}, auth); return (r && r[0] && r[0].data) || { liste: [] } }
async function speichern(d, auth) { await db('os_docs?on_conflict=app,pfad', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { app: 'oc', pfad: PFAD, data: d, updated_at: new Date().toISOString() } }, auth) }

const iban = s => String(s || '').replace(/\s/g, '').toUpperCase()
const tag = s => String(s || '').slice(0, 10)
const plusTage = n => new Date(Date.now() + n * 864e5).toISOString()
const rueckkehr = req => { const h = req.headers.get('origin') || ('https://' + (req.headers.get('host') || '')); return h.replace(/\/$/, '').replace('://www.', '://') + '/api/bank/rueckkehr' }

function saldoAus(L) {
  const B = (L && L.balances) || []
  const r = ['CLBD', 'ITBD', 'ITAV', 'CLAV', 'XPCD', 'OPBD'].map(t => B.find(b => b.balance_type === t)).find(Boolean) || B[0]
  if (!r) return { saldo: null, saldoAm: '' }
  return { saldo: Math.round(Number((r.balance_amount || {}).amount || 0) * 100) / 100, saldoAm: tag(r.reference_date || r.last_change_date_time) || new Date().toISOString().slice(0, 10) }
}
function umsatz(t, eigene) {
  const roh = Number((t.transaction_amount || {}).amount || 0)
  const b = Math.round((t.credit_debit_indicator === 'DBIT' ? -Math.abs(roh) : t.credit_debit_indicator === 'CRDT' ? Math.abs(roh) : roh) * 100) / 100
  const raus = b < 0
  const n = String(((raus ? t.creditor : t.debtor) || {}).name || ((raus ? t.debtor : t.creditor) || {}).name || '').trim()
  let i = iban(((raus ? t.creditor_account : t.debtor_account) || {}).iban)
  if (i === eigene) i = ''
  const zweck = [].concat(t.remittance_information || []).join(' ')
  const z = [t.bank_transaction_code && t.bank_transaction_code.description, zweck].filter(Boolean).join(' · ').replace(/\s+/g, ' ').trim().slice(0, 300)
  const x = t.entry_reference || t.transaction_id || crypto.createHash('sha1').update([tag(t.booking_date), b, n, z].join('|')).digest('hex').slice(0, 20)
  return { x: 'eb:' + x, d: tag(t.booking_date) || tag(t.value_date), b, n: n.slice(0, 120), i: /^[A-Z]{2}\d{2}/.test(i) ? i : '', z }
}

async function kontenMitSaldo(auth, mitSaldo) {
  const d = await laden(auth); const out = []
  for (const v of d.liste || []) for (const k of v.konten || []) {
    let s = { saldo: null, saldoAm: '' }, fehler = ''
    if (mitSaldo) { try { s = saldoAus(await eb('/accounts/' + encodeURIComponent(k.uid) + '/balances')) } catch (e) { fehler = e.message } }
    out.push({ id: k.uid, iban: k.iban, bank: v.bank, inhaber: k.inhaber || k.name || '', verbunden: !fehler, abgelaufen: !!(v.bis && v.bis < new Date().toISOString().slice(0, 10)), bis: v.bis, geprueft: new Date().toISOString().slice(0, 10), saldo: s.saldo, saldoAm: s.saldoAm, fehler })
  }
  return out
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const auth = req.headers.get('authorization')
    const b = await req.json().catch(() => ({}))
    if (b.aktion === 'status') {
      const d = await laden(auth)
      return antwort({ bereit: !fehlt().length, fehlt: fehlt(), verbindungen: (d.liste || []).map(v => ({ id: v.id, bank: v.bank, art: v.art, bis: v.bis, am: v.am, von: v.von, konten: (v.konten || []).map(k => ({ iban: k.iban, name: k.name })) })) })
    }
    if (fehlt().length) return antwort({ error: 'Die Bankanbindung ist noch nicht eingerichtet. In Vercel fehlt: ' + fehlt().join(', '), setup: true })

    if (b.aktion === 'banken') {
      const j = await eb('/aspsps?country=DE')
      return antwort({ banken: (j.aspsps || []).map(a => ({ name: a.name, max: a.maximum_consent_validity || 0, arten: a.psu_types || [] })).sort((x, y) => x.name.localeCompare(y.name, 'de')) })
    }
    if (b.aktion === 'verbinden') {
      const name = String(b.bank || '').trim(); if (!name) return antwort({ error: 'Bitte eine Bank wählen.' }, 400)
      const art = b.art === 'personal' ? 'personal' : 'business'
      let max = 180 * 86400
      try { const j = await eb('/aspsps?country=DE'); const a = (j.aspsps || []).find(x => x.name === name); if (a && a.maximum_consent_validity) max = Math.min(max, a.maximum_consent_validity) } catch (e) { }
      const state = crypto.randomBytes(12).toString('hex')
      const j = await eb('/auth', { method: 'POST', body: { access: { valid_until: new Date(Date.now() + (max - 3600) * 1000).toISOString() }, aspsp: { name, country: 'DE' }, state, redirect_url: rueckkehr(req), psu_type: art, language: 'de' } })
      return antwort({ url: j.url, state })
    }
    if (b.aktion === 'sitzung') {
      const code = String(b.code || ''); if (!code) return antwort({ error: 'Code fehlt.' }, 400)
      const s = await eb('/sessions', { method: 'POST', body: { code } })
      const konten = (s.accounts || []).map(a => ({ uid: a.uid, iban: iban((a.account_id || {}).iban), name: a.name || a.product || '', inhaber: a.name || '', waehrung: a.currency || 'EUR' })).filter(k => k.uid)
      const d = await laden(auth); const liste = (d.liste || [])
      // gleiche Konten aus älteren Verbindungen ersetzen
      const neu = new Set(konten.map(k => k.iban))
      const rest = liste.map(v => Object.assign({}, v, { konten: (v.konten || []).filter(k => !neu.has(k.iban)) })).filter(v => v.konten.length)
      rest.push({ id: s.session_id, bank: (s.aspsp || {}).name || String(b.bank || ''), art: s.psu_type || '', bis: tag((s.access || {}).valid_until), am: new Date().toISOString(), von: String(b.von || ''), konten })
      await speichern({ liste: rest }, auth)
      return antwort({ ok: true, bank: (s.aspsp || {}).name || '', konten: konten.length })
    }
    if (b.aktion === 'trennen') {
      const d = await laden(auth); const v = (d.liste || []).find(x => x.id === b.id)
      if (v) { try { await eb('/sessions/' + encodeURIComponent(v.id), { method: 'DELETE' }) } catch (e) { } }
      await speichern({ liste: (d.liste || []).filter(x => x.id !== b.id) }, auth)
      return antwort({ ok: true })
    }
    if (b.aktion === 'konten') return antwort({ konten: await kontenMitSaldo(auth, b.mitSaldo !== false) })
    if (b.aktion === 'kontostaende') {
      // zwischengespeicherte Kontostände (bank/stand), höchstens maxStunden alt – schont die begrenzten Abrufe je Tag
      const max = Math.max(0.25, Number(b.maxStunden) || 4)
      const r = await db('os_docs?select=data&app=eq.oc&pfad=eq.' + encodeURIComponent('bank/stand'), {}, auth)
      const st = (r && r[0] && r[0].data) || {}
      if (st.am && st.konten && st.konten.length && (Date.now() - new Date(st.am).getTime()) < max * 3600e3) return antwort({ konten: st.konten, am: st.am, zwischengespeichert: true })
      const konten = await kontenMitSaldo(auth, true), am = new Date().toISOString()
      await db('os_docs?on_conflict=app,pfad', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { app: 'oc', pfad: 'bank/stand', data: Object.assign({}, st, { am, von: 'automatisch', konten }), updated_at: am } }, auth)
      return antwort({ konten, am })
    }
    if (b.aktion === 'umsaetze') {
      const d = await laden(auth); const id = String(b.id || ''), ib = iban(b.iban)
      let k = null; for (const v of d.liste || []) for (const x of v.konten || []) if (x.uid === id || (ib && x.iban === ib)) k = x
      if (!k) return antwort({ error: 'Konto ist nicht verbunden.' }, 404)
      const seit = /^\d{4}-\d{2}-\d{2}$/.test(b.seit || '') ? b.seit : new Date(Date.now() - 89 * 864e5).toISOString().slice(0, 10)
      const out = []; let weiter = '', seiten = 0
      while (seiten < 30) {
        const q = new URLSearchParams({ date_from: seit }); if (weiter) q.set('continuation_key', weiter)
        const j = await eb('/accounts/' + encodeURIComponent(k.uid) + '/transactions?' + q.toString()); seiten++
        for (const t of j.transactions || []) { if (t.status && t.status !== 'BOOK') continue; const u = umsatz(t, k.iban); if (u.d && u.d >= seit) out.push(u) }
        weiter = j.continuation_key || ''; if (!weiter) break
      }
      return antwort({ umsaetze: out, seiten })
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
