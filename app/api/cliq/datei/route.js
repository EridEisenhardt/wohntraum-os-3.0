// Dateien in Cliq: herunterladen (POST JSON {id}) und senden (POST multipart: chat, text, file).
// Grenze von Vercel: etwa 4 MB je Anfrage.
import { angemeldet, antwort } from '../../_lib/auth'
import { bereit, konto, zugang, CLIQ } from '../../_lib/cliq'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const GRENZE = 4 * 1024 * 1024

export async function POST(req) {
  try {
    const user = await angemeldet(req)
    if (!user) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    if (!bereit()) return antwort({ error: 'Cliq ist noch nicht eingerichtet.' }, 400)
    const auth = req.headers.get('authorization')
    const k = await konto(auth)
    if (!k) return antwort({ error: 'Dein Cliq-Konto ist noch nicht verbunden.' }, 400)
    const token = await zugang(user.id, k)
    const art = req.headers.get('content-type') || ''

    if (art.startsWith('multipart/form-data')) {
      const fd = await req.formData()
      const chat = String(fd.get('chat') || ''), kommentar = String(fd.get('text') || '')
      const dateien = fd.getAll('file').filter(f => f && typeof f === 'object')
      if (!chat || !dateien.length) return antwort({ error: 'Chat oder Datei fehlt.' }, 400)
      const aus = new FormData()
      for (const f of dateien.slice(0, 10)) aus.append('file', f, f.name)
      if (kommentar) aus.append('comments', JSON.stringify(dateien.map((_, i) => i === 0 ? kommentar : '')))
      const r = await fetch(CLIQ() + '/api/v2/chats/' + encodeURIComponent(chat) + '/files', { method: 'POST', headers: { Authorization: 'Zoho-oauthtoken ' + token }, body: aus, cache: 'no-store' })
      if (!r.ok) { const t = await r.text(); let j = {}; try { j = JSON.parse(t) } catch (e) { } return antwort({ error: 'Cliq: ' + (j.message || r.status) + (r.status === 403 ? ' (bitte Cliq im OS einmal trennen und neu verbinden)' : '') }, 400) }
      return antwort({ ok: true })
    }

    const b = await req.json().catch(() => ({}))
    const id = String(b.id || ''); if (!id) return antwort({ error: 'Datei fehlt.' }, 400)
    const r = await fetch(CLIQ() + '/api/v2/files/' + encodeURIComponent(id), { headers: { Authorization: 'Zoho-oauthtoken ' + token }, cache: 'no-store' })
    if (!r.ok) {
      const t = await r.text(); let j = {}; try { j = JSON.parse(t) } catch (e) { }
      return antwort({ error: r.status === 403 || /scope|permission/i.test(j.message || '') ? 'Für Dateien braucht das OS eine zusätzliche Freigabe. Bitte auf der Cliq-Seite einmal „Verbindung trennen“ und neu verbinden.' : 'Datei nicht ladbar (' + (j.message || r.status) + ').' }, 400)
    }
    const groesse = Number(r.headers.get('content-length') || 0)
    if (groesse > GRENZE) return antwort({ error: 'Die Datei ist größer als 4 MB und lässt sich nur direkt in Cliq öffnen.', gross: true }, 413)
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > GRENZE) return antwort({ error: 'Die Datei ist größer als 4 MB und lässt sich nur direkt in Cliq öffnen.', gross: true }, 413)
    return new Response(buf, { headers: { 'Content-Type': r.headers.get('content-type') || 'application/octet-stream', 'Content-Disposition': r.headers.get('content-disposition') || 'attachment' } })
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
