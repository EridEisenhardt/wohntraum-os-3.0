// DocuSign im Wohntraum OS: Verträge zur Unterschrift senden, Stand abfragen, stornieren, unterschriebenes PDF laden
// GET /api/docusign ist die Rücksprungseite nach der einmaligen Zustimmung bei DocuSign.
import { angemeldet, antwort } from '../_lib/auth'
import { dsBereit, ds, dsStand, dsToken, zustimmungsLink } from '../_lib/docusign'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const seite = (titel, text) => new Response('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titel + '</title></head><body style="font:16px/1.5 system-ui,sans-serif;background:#f3f5f8;color:#18202c;margin:0;padding:60px 20px;text-align:center"><h1 style="font-size:22px">' + titel + '</h1><p>' + text + '</p></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } })

export async function GET(req) {
  const u = new URL(req.url)
  if (u.searchParams.get('error')) return seite('DocuSign nicht verbunden', 'Die Zustimmung wurde nicht erteilt (' + String(u.searchParams.get('error')).replace(/[<>&"]/g, '') + ').')
  return seite('DocuSign ist verbunden', 'Die Zustimmung ist gespeichert. Das Wohntraum OS kann jetzt Verträge über DocuSign versenden. Dieses Fenster kann geschlossen werden.')
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    if (!dsBereit()) return antwort({ error: 'DocuSign ist noch nicht eingerichtet. In Vercel fehlen DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID oder DOCUSIGN_PRIVATE_KEY.', setup: true })
    const b = await req.json().catch(() => ({}))
    const herkunft = (req.headers.get('origin') || ('https://' + req.headers.get('host'))).replace(/\/$/, '')
    try {
      if (b.aktion === 'test') { const t = await dsToken(); return antwort({ ok: true, konto: t.basis.replace(/\/restapi.*$/, '') }) }

      if (b.aktion === 'senden') {
        const dok = (b.dokumente || []).filter(d => d && d.base64)
        const signers = (b.unterzeichner || []).filter(s => s && /@/.test(s.email || ''))
        if (!dok.length) return antwort({ error: 'Kein Vertrag ausgewählt.' }, 400)
        if (!signers.length) return antwort({ error: 'Keine Unterzeichner mit E-Mail-Adresse.' }, 400)
        const env = {
          emailSubject: String(b.betreff || 'Vertrag zur Unterschrift').slice(0, 100),
          emailBlurb: String(b.nachricht || '').slice(0, 2000),
          documents: dok.map((d, i) => ({ documentBase64: d.base64, name: String(d.name || 'Vertrag ' + (i + 1)).slice(0, 100), fileExtension: 'pdf', documentId: String(i + 1) })),
          recipients: { signers: signers.map(s => ({ email: s.email, name: s.name || s.email, recipientId: String(s.recipientId), routingOrder: String(s.routingOrder || 1), roleName: s.roleName || '', tabs: s.tabs || {} })) },
          status: 'sent'
        }
        const r = await ds('/envelopes', { method: 'POST', json: env })
        return antwort({ ok: true, envelopeId: r.envelopeId, status: r.status })
      }

      if (b.aktion === 'stand') return antwort({ ok: true, stand: await dsStand(String(b.envelopeId || '')) })

      if (b.aktion === 'stornieren') {
        await ds('/envelopes/' + encodeURIComponent(String(b.envelopeId || '')), { method: 'PUT', json: { status: 'voided', voidedReason: String(b.grund || 'Vom Vermieter zurückgezogen').slice(0, 200) } })
        return antwort({ ok: true })
      }

      if (b.aktion === 'dokument') {
        const pdf = await ds('/envelopes/' + encodeURIComponent(String(b.envelopeId || '')) + '/documents/combined', { roh: true })
        if (pdf.length > 3.2e6) return antwort({ error: 'Das Dokument ist zu groß zum Herunterladen über das OS. Bitte direkt in DocuSign öffnen.' })
        return antwort({ ok: true, base64: pdf.toString('base64') })
      }
      return antwort({ error: 'Unbekannte Aktion.' }, 400)
    } catch (e) {
      if (e.zustimmung) return antwort({ error: e.message, zustimmung: zustimmungsLink(herkunft + '/api/docusign') })
      throw e
    }
  } catch (e) {
    return antwort({ error: e.message || String(e) }, 500)
  }
}
