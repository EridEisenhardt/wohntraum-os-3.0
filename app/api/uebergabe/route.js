// Übergabeprotokolle: Unterlagen (Protokoll, Wohnungsgeberbestätigung) per Mail an den Mieter senden.
// Mailversand über Microsoft Graph (App-Registrierung aus MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET).
// Benötigt die Anwendungsberechtigung Mail.Send, für große Anhänge (über 3 MB) zusätzlich Mail.ReadWrite.
// Absender: MS_MAIL_ABSENDER (Standard hausverwaltung@andersmacher.info).
import { angemeldet, antwort } from '../_lib/auth'
import { graph, graphBereit } from '../_lib/graph'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BUCKET = 'uebergaben'
const KLEIN = 3 * 1024 * 1024

async function ausSpeicher(pfad, auth) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const p = String(pfad || '')
  if (!p || p.includes('..')) throw new Error('Ungültiger Dateipfad.')
  const r = await fetch(url + '/storage/v1/object/authenticated/' + BUCKET + '/' + p.split('/').map(encodeURIComponent).join('/'),
    { headers: { apikey: key, Authorization: auth }, cache: 'no-store' })
  if (!r.ok) throw new Error('Datei nicht gefunden: ' + p.split('/').pop())
  return Buffer.from(await r.arrayBuffer())
}
const htmlText = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const body = await req.json().catch(() => ({}))

    if (body.aktion === 'mail') {
      const fehlt = graphBereit()
      if (fehlt.length) return antwort({ error: 'Outlook ist noch nicht verbunden. Es fehlt: ' + fehlt.join(', ') }, 400)
      const an = [...new Set(String(body.an || '').split(/[,;\s]+/).map(s => s.trim()).filter(s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)))]
      if (!an.length) return antwort({ error: 'Bitte eine gültige E-Mail-Adresse des Mieters eintragen.' }, 400)
      const anh = (body.anhaenge || []).slice(0, 5)
      if (!anh.length) return antwort({ error: 'Keine Anhänge ausgewählt.' }, 400)
      const auth = req.headers.get('authorization')
      const dateien = []
      for (const a of anh) dateien.push({ name: String(a.name || 'Dokument.pdf'), daten: await ausSpeicher(a.pfad, auth) })
      const mb = encodeURIComponent(process.env.MS_MAIL_ABSENDER || 'hausverwaltung@andersmacher.info')
      const nachricht = {
        subject: String(body.betreff || 'Unterlagen zur Wohnungsübergabe'),
        body: { contentType: 'HTML', content: '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">' + htmlText(body.text) + '</div>' },
        toRecipients: an.map(address => ({ emailAddress: { address } })),
      }
      const gesamt = dateien.reduce((s, d) => s + d.daten.length, 0)
      try {
        if (gesamt <= KLEIN) {
          nachricht.attachments = dateien.map(d => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: d.name, contentType: 'application/pdf', contentBytes: d.daten.toString('base64') }))
          await graph('/users/' + mb + '/sendMail', { method: 'POST', json: { message: nachricht, saveToSentItems: true } })
        } else {
          // Große Anhänge: Entwurf anlegen, Anhänge per Upload-Sitzung hochladen, dann senden
          const entwurf = await graph('/users/' + mb + '/messages', { method: 'POST', json: nachricht })
          const basis = '/users/' + mb + '/messages/' + encodeURIComponent(entwurf.id)
          for (const d of dateien) {
            if (d.daten.length <= KLEIN) {
              await graph(basis + '/attachments', { method: 'POST', json: { '@odata.type': '#microsoft.graph.fileAttachment', name: d.name, contentType: 'application/pdf', contentBytes: d.daten.toString('base64') } })
              continue
            }
            const s = await graph(basis + '/attachments/createUploadSession', { method: 'POST', json: { AttachmentItem: { attachmentType: 'file', name: d.name, size: d.daten.length, contentType: 'application/pdf' } } })
            const STUECK = 3 * 1024 * 1024
            for (let i = 0; i < d.daten.length; i += STUECK) {
              const teil = d.daten.subarray(i, Math.min(i + STUECK, d.daten.length))
              const r = await fetch(s.uploadUrl, { method: 'PUT', headers: { 'Content-Length': String(teil.length), 'Content-Range': 'bytes ' + i + '-' + (i + teil.length - 1) + '/' + d.daten.length }, body: teil })
              if (!r.ok && r.status !== 201 && r.status !== 200) throw new Error('Anhang konnte nicht hochgeladen werden (' + r.status + ').')
            }
          }
          await graph(basis + '/send', { method: 'POST' })
        }
      } catch (e) {
        if (e.status === 403 || e.status === 401) throw new Error('Outlook erlaubt den Versand noch nicht. In der Microsoft-App-Registrierung muss die Berechtigung Mail.Send' + (gesamt > KLEIN ? ' und Mail.ReadWrite' : '') + ' (Anwendung, mit Administratorzustimmung) freigegeben werden.')
        throw e
      }
      return antwort({ ok: true, an, von: decodeURIComponent(mb) })
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
