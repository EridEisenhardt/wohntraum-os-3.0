// Microsoft Graph (App-Anmeldung) – gemeinsam für Outlook und OneDrive/SharePoint.
// Umgebungsvariablen: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET.
let TOKEN = { t: '', bis: 0 }
export function graphBereit() {
  return ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'].filter(k => !String(process.env[k] || '').trim())
}
export async function graphToken() {
  if (TOKEN.t && Date.now() < TOKEN.bis) return TOKEN.t
  const r = await fetch('https://login.microsoftonline.com/' + process.env.MS_TENANT_ID + '/oauth2/v2.0/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.MS_CLIENT_ID, client_secret: process.env.MS_CLIENT_SECRET, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error('Anmeldung bei Microsoft fehlgeschlagen: ' + (j.error_description || j.error || r.status))
  TOKEN = { t: j.access_token, bis: Date.now() + (j.expires_in - 120) * 1000 }
  return TOKEN.t
}
export async function graph(pfad, opt = {}) {
  const r = await fetch(pfad.startsWith('http') ? pfad : 'https://graph.microsoft.com/v1.0' + pfad, {
    method: opt.method || 'GET',
    headers: { Authorization: 'Bearer ' + (await graphToken()), ...(opt.json ? { 'content-type': 'application/json' } : {}), ...(opt.headers || {}) },
    body: opt.json ? JSON.stringify(opt.json) : opt.body,
    cache: 'no-store',
  })
  if (opt.erlaube404 && r.status === 404) return null
  if (!r.ok) {
    let m = r.status
    try { const j = await r.json(); m = (j.error && j.error.message) || m } catch {}
    const e = new Error('Microsoft: ' + m); e.status = r.status; throw e
  }
  if (r.status === 204) return {}
  return opt.roh ? r.text() : r.json()
}
