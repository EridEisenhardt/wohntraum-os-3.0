// DocuSign für das Wohntraum OS (JWT-Anmeldung, Umschläge senden, Stand abfragen, Dokument laden)
// Benötigt in Vercel: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID, DOCUSIGN_PRIVATE_KEY
// Optional: DOCUSIGN_AUTH_SERVER (Test: account-d.docusign.com, Echtbetrieb: account.docusign.com)
import crypto from 'crypto'

export const dsBereit = () => !!(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_USER_ID && process.env.DOCUSIGN_ACCOUNT_ID && process.env.DOCUSIGN_PRIVATE_KEY)
const AUTH = () => (process.env.DOCUSIGN_AUTH_SERVER || 'account-d.docusign.com').replace(/^https?:\/\//, '').replace(/\/$/, '')
export const zustimmungsLink = redirect => 'https://' + AUTH() + '/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=' + encodeURIComponent(process.env.DOCUSIGN_INTEGRATION_KEY || '') + '&redirect_uri=' + encodeURIComponent(redirect)

// Privaten Schlüssel aus der Umgebungsvariable in ein sauberes PEM bringen (Zeilenumbrüche können beim Einfügen verloren gehen)
function pem() {
  let k = String(process.env.DOCUSIGN_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n')
  const m = k.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/)
  if (!m) throw new Error('DOCUSIGN_PRIVATE_KEY ist nicht vollständig (BEGIN- und END-Zeile fehlen).')
  const body = m[2].replace(/\s+/g, '').match(/.{1,64}/g).join('\n')
  return '-----BEGIN ' + m[1] + '-----\n' + body + '\n-----END ' + m[1] + '-----\n'
}
const b64u = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

let CACHE = { token: '', bis: 0, basis: '' }
export async function dsToken() {
  if (CACHE.token && Date.now() < CACHE.bis) return CACHE
  const jetzt = Math.floor(Date.now() / 1000)
  const kopf = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const inhalt = b64u(JSON.stringify({ iss: process.env.DOCUSIGN_INTEGRATION_KEY, sub: process.env.DOCUSIGN_USER_ID, aud: AUTH(), iat: jetzt, exp: jetzt + 3600, scope: 'signature impersonation' }))
  const sig = crypto.createSign('RSA-SHA256').update(kopf + '.' + inhalt).sign(pem())
  const jwt = kopf + '.' + inhalt + '.' + b64u(sig)
  const r = await fetch('https://' + AUTH() + '/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt, cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) { const e = new Error(j.error === 'consent_required' ? 'DocuSign: Die Zustimmung fehlt noch.' : 'DocuSign-Anmeldung fehlgeschlagen: ' + (j.error_description || j.error || r.status)); e.zustimmung = j.error === 'consent_required'; throw e }
  let basis = CACHE.basis
  if (!basis) {
    const u = await fetch('https://' + AUTH() + '/oauth/userinfo', { headers: { Authorization: 'Bearer ' + j.access_token }, cache: 'no-store' }).then(x => x.json())
    const acc = (u.accounts || []).find(a => a.account_id === process.env.DOCUSIGN_ACCOUNT_ID) || (u.accounts || []).find(a => a.is_default)
    if (!acc) throw new Error('DocuSign: Konto ' + process.env.DOCUSIGN_ACCOUNT_ID + ' nicht gefunden.')
    basis = acc.base_uri.replace(/\/$/, '') + '/restapi/v2.1/accounts/' + acc.account_id
  }
  CACHE = { token: j.access_token, bis: Date.now() + (Number(j.expires_in || 3600) - 300) * 1000, basis }
  return CACHE
}
export async function ds(pfad, opt = {}) {
  const { token, basis } = await dsToken()
  const r = await fetch(basis + pfad, { method: opt.method || 'GET', headers: { Authorization: 'Bearer ' + token, Accept: opt.roh ? 'application/pdf' : 'application/json', ...(opt.json ? { 'Content-Type': 'application/json' } : {}) }, body: opt.json ? JSON.stringify(opt.json) : undefined, cache: 'no-store' })
  if (opt.roh) { if (!r.ok) throw new Error('DocuSign-Fehler ' + r.status); return Buffer.from(await r.arrayBuffer()) }
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('DocuSign: ' + (j.message || j.errorCode || r.status))
  return j
}
// Stand eines Umschlags mit Unterzeichnern
export async function dsStand(envelopeId) {
  const e = await ds('/envelopes/' + encodeURIComponent(envelopeId) + '?include=recipients')
  const R = (e.recipients && e.recipients.signers) || []
  return {
    status: e.status, gesendet: e.sentDateTime || '', fertig: e.completedDateTime || '', storniert: e.voidedDateTime || '',
    unterzeichner: R.map(s => ({ id: s.recipientId, rolle: s.roleName || '', name: s.name, email: s.email, status: s.status, unterschrieben: s.signedDateTime || '', reihenfolge: s.routingOrder }))
  }
}
