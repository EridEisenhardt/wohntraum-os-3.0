// Outlook-Anbindung (Microsoft 365 / Graph) für die Mieterkonten: Mails zu einem Mieter suchen und laden.
// Benötigt die Umgebungsvariablen MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET (App-Registrierung mit
// Anwendungsberechtigung Mail.Read und Administratorzustimmung) und MS_MAILBOXES (Postfächer, kommagetrennt).
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'

let TOKEN = { t: '', bis: 0 }
async function graphToken() {
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
async function graph(pfad, opt = {}) {
  const r = await fetch('https://graph.microsoft.com/v1.0' + pfad, { headers: { Authorization: 'Bearer ' + (await graphToken()), ...(opt.headers || {}) }, cache: 'no-store' })
  if (!r.ok) { let m = r.status; try { const j = await r.json(); m = (j.error && j.error.message) || m } catch {} throw new Error('Outlook: ' + m) }
  return opt.roh ? r.text() : r.json()
}
const adr = x => (x && x.emailAddress && x.emailAddress.address || '').toLowerCase()
const nm = x => (x && x.emailAddress && (x.emailAddress.name || x.emailAddress.address)) || ''
const text = h => String(h || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim()

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const env = process.env
    const boxes = String(env.MS_MAILBOXES || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET || !boxes.length)
      return antwort({ error: 'Outlook ist noch nicht verbunden.', setup: true })
    const body = await req.json().catch(() => ({}))
    if (body.aktion === 'suchen') {
      const such = [...new Set((body.adressen || []).map(a => String(a).trim().toLowerCase()).filter(a => /@/.test(a)))].slice(0, 5)
      if (!such.length) return antwort({ error: 'Beim Mieter ist keine E-Mail-Adresse hinterlegt.' }, 400)
      const out = [], fehler = []
      for (const mb of boxes) for (const a of such) {
        try {
          const j = await graph('/users/' + encodeURIComponent(mb) + '/messages?$top=50&$select=id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,bodyPreview,hasAttachments,isDraft&$search=' + encodeURIComponent('"participants:' + a + '"'))
          for (const m of j.value || []) {
            if (m.isDraft) continue
            const von = adr(m.from), an = (m.toRecipients || []).concat(m.ccRecipients || []).map(adr)
            out.push({ id: m.id, mailbox: mb, msgId: m.internetMessageId || m.id, betreff: m.subject || '', von: nm(m.from) + (von ? ' <' + von + '>' : ''),
              an: (m.toRecipients || []).map(r => nm(r) + ' <' + adr(r) + '>').join(', '), datum: m.receivedDateTime || m.sentDateTime,
              richtung: such.includes(von) ? 'Eingang' : 'Ausgang', vorschau: m.bodyPreview || '', anhang: !!m.hasAttachments })
          }
        } catch (e) { fehler.push(mb + ': ' + e.message) }
      }
      const seen = new Set(), L = out.filter(m => !seen.has(m.msgId) && seen.add(m.msgId)).sort((a, b) => String(b.datum).localeCompare(String(a.datum)))
      return antwort({ mails: L, fehler })
    }
    if (body.aktion === 'laden') {
      const mb = String(body.mailbox || ''), id = String(body.id || '')
      if (!boxes.includes(mb) || !id) return antwort({ error: 'Mail nicht gefunden.' }, 400)
      const base = '/users/' + encodeURIComponent(mb) + '/messages/' + encodeURIComponent(id)
      const m = await graph(base + '?$select=body,subject')
      const mime = await graph(base + '/$value', { roh: true })
      const t = m.body && m.body.contentType === 'html' ? text(m.body.content) : String(m.body && m.body.content || '')
      return antwort({ text: t.slice(0, 50000), mime })
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
