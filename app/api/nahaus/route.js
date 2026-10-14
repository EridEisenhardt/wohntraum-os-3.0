// Kontoumsätze aus Nahaus (Bankanbindung über GoCardless) für das Wohntraum OS.
// Benötigt in Vercel: NAHAUS_EMAIL und NAHAUS_PASSWORD (API-Benutzer aus Nahaus) – oder alternativ NAHAUS_TOKEN. Optional: NAHAUS_API_URL.
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ROOT = (process.env.NAHAUS_API_URL || 'https://europe-west3-pool-nahaus-de.cloudfunctions.net').replace(/\/+$/, '')
const BASE = ROOT + '/api-v2'
let TOKEN = { wert: '', bis: 0 }

const fehlt = () => (process.env.NAHAUS_TOKEN || (process.env.NAHAUS_EMAIL && process.env.NAHAUS_PASSWORD)) ? [] :
  ['NAHAUS_EMAIL', 'NAHAUS_PASSWORD'].filter(k => !process.env[k])

// Anmeldung mit dem API-Benutzer; Token wird zwischengespeichert (ca. 50 Minuten)
async function token(neu) {
  if (!process.env.NAHAUS_EMAIL) return process.env.NAHAUS_TOKEN
  if (!neu && TOKEN.wert && Date.now() < TOKEN.bis) return TOKEN.wert
  const r = await fetch(ROOT + '/api-auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.NAHAUS_EMAIL, password: process.env.NAHAUS_PASSWORD }), cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(r.status === 401 ? 'Nahaus-Anmeldung fehlgeschlagen: E-Mail oder Passwort des API-Benutzers stimmen nicht (NAHAUS_EMAIL / NAHAUS_PASSWORD in Vercel prüfen).' : 'Nahaus-Anmeldung fehlgeschlagen (' + r.status + ').')
  const d = j.data || j
  const wert = d.token || d.idToken || d.accessToken || d.access_token || (typeof d === 'string' ? d : '')
  if (!wert) throw new Error('Nahaus-Anmeldung lieferte keinen Token.')
  const sek = Number(d.expiresIn || d.expires_in || 3600)
  TOKEN = { wert, bis: Date.now() + Math.max(300, sek - 600) * 1000 }
  return wert
}

async function nh(pfad, query, zweiterVersuch) {
  const u = new URL(BASE + pfad)
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
  const r = await fetch(u, { headers: { authorization: 'Bearer ' + await token(zweiterVersuch), accept: 'application/json' }, cache: 'no-store' })
  if ((r.status === 401 || r.status === 403) && !zweiterVersuch && process.env.NAHAUS_EMAIL) return nh(pfad, query, true)
  if (r.status === 401 || r.status === 403) throw new Error('Nahaus lehnt den Zugang ab (' + r.status + '). Bitte die Nahaus-Zugangsdaten in Vercel prüfen.')
  if (!r.ok) throw new Error('Nahaus antwortet mit Fehler ' + r.status + '.')
  return r.json()
}
// Datum aus Firestore-Zeitstempel (Mitternacht deutscher Zeit) als JJJJ-MM-TT
const tag = t => (t && t._seconds ? new Date(t._seconds * 1000 + 12 * 3600e3).toISOString().slice(0, 10) : '')
const iban = s => String(s || '').replace(/\s/g, '').toUpperCase()

function umsatz(t, eigene) {
  const b = Math.round(Number((t.transactionAmount || {}).amount || 0) * 100) / 100
  const raus = b < 0
  const n = String((raus ? t.creditorName : t.debtorName) || (raus ? t.debtorName : t.creditorName) || '').trim()
  let i = iban(raus ? (t.creditorAccount || {}).iban : (t.debtorAccount || {}).iban)
  if (i === eigene) i = ''
  const zweck = t.remittanceInformationUnstructured || t.remittanceInformationStructured ||
    Object.values(t.remittanceInformationStructuredArray || {}).join(' ') || ''
  const z = [t.additionalInformation, zweck].filter(Boolean).join(' · ').replace(/\s+/g, ' ').trim().slice(0, 300)
  return { x: t.id, d: tag(t.bookingDate) || tag(t.valueDate), b, n: n.slice(0, 120), i: /^[A-Z]{2}\d{2}/.test(i) ? i : '', z }
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    if (fehlt().length) return antwort({ error: 'Nahaus ist noch nicht verbunden. In Vercel fehlt: ' + fehlt().join(', '), setup: true })
    const b = await req.json().catch(() => ({}))

    if (b.aktion === 'konten') {
      const j = await nh('/bank-accounts', { limit: 200 })
      const konten = (j.data || []).map(k => ({
        id: k.id, iban: iban(k.IBAN), bank: k.bank || '', inhaber: k.accountHolder || '',
        verbunden: !!k.isConnected, abgelaufen: !!k.requisitionExpired,
        geprueft: tag(k.lastHealthCheck), saldo: k.balance ? Number(k.balance.amount) : null, saldoAm: k.balance ? tag(k.balance.referenceDate) : ''
      }))
      return antwort({ konten })
    }

    if (b.aktion === 'umsaetze') {
      // Umsätze eines Kontos ab Datum "seit" (neueste zuerst, seitenweise)
      const id = String(b.id || ''); if (!id) return antwort({ error: 'Konto fehlt.' }, 400)
      const seit = /^\d{4}-\d{2}-\d{2}$/.test(b.seit || '') ? b.seit : '2026-01-01'
      const out = []; let cursor = '', seiten = 0, eigene = ''
      while (seiten < 40) {
        const j = await nh('/bank-accounts/' + encodeURIComponent(id) + '/transactions', { limit: 100, cursor })
        const L = j.data || []; seiten++
        for (const t of L) {
          if (!eigene && t.bankAccount) eigene = iban(t.bankAccount.IBAN)
          if (t.status && t.status !== 'BOOKED') continue
          const u = umsatz(t, eigene)
          if (u.d && u.d >= seit) out.push(u)
        }
        const letzte = L.length ? tag(L[L.length - 1].bookingDate) : ''
        if (!j.nextCursor || !L.length || j.nextCursor === cursor || (letzte && letzte < seit)) break
        cursor = j.nextCursor
      }
      return antwort({ umsaetze: out, seiten })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
