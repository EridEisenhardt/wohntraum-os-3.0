// Postfach im Wohntraum OS: das Outlook-Postfach der Hausverwaltung 1:1 lesen und bearbeiten (Microsoft Graph).
// Postfach: MS_POSTFACH (Standard hausverwaltung@andersmacher.info). Anwendungsberechtigungen: Mail.ReadWrite und Mail.Send.
// Anhänge zum Senden kommen aus dem OS-Speicher (Supabase), aus OneDrive (Mieterordner) oder aus einer anderen Mail.
import { angemeldet, antwort } from '../_lib/auth'
import { graph, graphBereit, graphToken } from '../_lib/graph'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const POSTFACH = () => process.env.MS_POSTFACH || 'hausverwaltung@andersmacher.info'
const BOX = () => '/users/' + encodeURIComponent(POSTFACH())
const KLEIN = 3 * 1024 * 1024
const BUCKETS = ['uebergaben', 'mieterakten', 'vertraege']
const ROOT = 'Prozesslandkarte 3.0'
const WELL = { inbox: 'Posteingang', drafts: 'Entwürfe', sentitems: 'Gesendete Elemente', deleteditems: 'Gelöschte Elemente', junkemail: 'Junk-E-Mail', archive: 'Archiv', outbox: 'Postausgang' }
const LISTFELDER = 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,bodyPreview,isRead,hasAttachments,flag,importance,isDraft,conversationId,parentFolderId,internetMessageId,categories'

let WK = { m: null, bis: 0 }
async function wellKnown() {
  if (WK.m && Date.now() < WK.bis) return WK.m
  const m = {}
  await Promise.all(Object.keys(WELL).map(async k => { try { const f = await graph(BOX() + '/mailFolders/' + k + '?$select=id'); m[f.id] = k } catch {} }))
  WK = { m, bis: Date.now() + 3600e3 }
  return m
}
async function alleOrdner() {
  const wk = await wellKnown(), out = []
  async function ebene(url, eltern, tiefe) {
    let u = url
    while (u) {
      const j = await graph(u)
      for (const f of j.value || []) {
        const k = wk[f.id] || ''
        out.push({ id: f.id, name: WELL[k] || f.displayName, wk: k, eltern, ungelesen: f.unreadItemCount || 0, gesamt: f.totalItemCount || 0, unter: f.childFolderCount || 0 })
        if (f.childFolderCount && tiefe < 4) await ebene(BOX() + '/mailFolders/' + f.id + '/childFolders?$top=100', f.id, tiefe + 1)
      }
      u = j['@odata.nextLink'] || ''
    }
  }
  await ebene(BOX() + '/mailFolders?$top=100', '', 0)
  return out
}
const adr = x => ({ name: (x && x.emailAddress && x.emailAddress.name) || '', mail: ((x && x.emailAddress && x.emailAddress.address) || '').toLowerCase() })
const kurz = m => ({ id: m.id, betreff: m.subject || '', von: adr(m.from), an: (m.toRecipients || []).map(adr), cc: (m.ccRecipients || []).map(adr),
  datum: m.receivedDateTime || m.sentDateTime, vorschau: m.bodyPreview || '', gelesen: !!m.isRead, anhang: !!m.hasAttachments,
  markiert: !!(m.flag && m.flag.flagStatus === 'flagged'), wichtig: m.importance === 'high', entwurf: !!m.isDraft, ordner: m.parentFolderId, msgId: m.internetMessageId || '', kategorien: m.categories || [] })
const empf = s => [...new Set(String(s || '').split(/[,;\s]+/).map(x => x.trim()).filter(x => /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(x)))].map(address => ({ emailAddress: { address } }))
const htmlText = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
const ids = b => (Array.isArray(b.ids) ? b.ids : [b.id]).filter(Boolean).slice(0, 100).map(String)

let DRIVE = { id: '', bis: 0 }
async function drive() {
  if (DRIVE.id && Date.now() < DRIVE.bis) return DRIVE.id
  const site = process.env.MS_SP_SITE || 'andersmacher.sharepoint.com:/sites/WohnTraumRheinhessenGmbH9'
  const s = await graph('/sites/' + site + '?$select=id'); const d = await graph('/sites/' + s.id + '/drive?$select=id')
  DRIVE = { id: d.id, bis: Date.now() + 3600e3 }; return d.id
}
async function anhangLaden(a, auth) {
  if (a.typ === 'speicher') {
    if (!BUCKETS.includes(a.bucket) || String(a.pfad || '').includes('..')) throw new Error('Anhang nicht erlaubt.')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const r = await fetch(url + '/storage/v1/object/authenticated/' + a.bucket + '/' + String(a.pfad).split('/').map(encodeURIComponent).join('/'), { headers: { apikey: key, Authorization: auth }, cache: 'no-store' })
    if (!r.ok) throw new Error('Anhang nicht gefunden: ' + (a.name || a.pfad))
    return { name: a.name || String(a.pfad).split('/').pop(), typ: a.contentType || r.headers.get('content-type') || 'application/octet-stream', daten: Buffer.from(await r.arrayBuffer()) }
  }
  if (a.typ === 'onedrive') {
    const d = await drive(); const x = await graph('/drives/' + d + '/items/' + encodeURIComponent(a.id))
    if (!(x.parentReference && decodeURIComponent(String(x.parentReference.path || '')).includes('/' + ROOT))) throw new Error('Datei nicht erlaubt.')
    const dl = x['@microsoft.graph.downloadUrl']
    const r = dl ? await fetch(dl) : await fetch('https://graph.microsoft.com/v1.0/drives/' + d + '/items/' + encodeURIComponent(a.id) + '/content', { headers: { Authorization: 'Bearer ' + (await graphToken()) } })
    if (!r.ok) throw new Error('Datei nicht lesbar: ' + x.name)
    return { name: x.name, typ: (x.file && x.file.mimeType) || 'application/octet-stream', daten: Buffer.from(await r.arrayBuffer()) }
  }
  throw new Error('Unbekannte Anhangsart.')
}
async function anhaengen(basis, f) {
  if (f.daten.length <= KLEIN) {
    await graph(basis + '/attachments', { method: 'POST', json: { '@odata.type': '#microsoft.graph.fileAttachment', name: f.name, contentType: f.typ, contentBytes: f.daten.toString('base64') } })
    return
  }
  const s = await graph(basis + '/attachments/createUploadSession', { method: 'POST', json: { AttachmentItem: { attachmentType: 'file', name: f.name, size: f.daten.length, contentType: f.typ } } })
  for (let i = 0; i < f.daten.length; i += KLEIN) {
    const teil = f.daten.subarray(i, Math.min(i + KLEIN, f.daten.length))
    const r = await fetch(s.uploadUrl, { method: 'PUT', headers: { 'Content-Length': String(teil.length), 'Content-Range': 'bytes ' + i + '-' + (i + teil.length - 1) + '/' + f.daten.length }, body: teil })
    if (!r.ok) throw new Error('Anhang ' + f.name + ' konnte nicht hochgeladen werden (' + r.status + ').')
  }
}
async function perMsgId(msgId, ordner) {
  const f = "internetMessageId eq '" + String(msgId).replace(/'/g, "''") + "'"
  const j = await graph(BOX() + (ordner ? '/mailFolders/' + ordner : '') + '/messages?$top=1&$select=id&$filter=' + encodeURIComponent(f))
  return (j.value && j.value[0] && j.value[0].id) || ''
}

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const fehlt = graphBereit()
    if (fehlt.length) return antwort({ error: 'Outlook ist noch nicht verbunden. Es fehlt: ' + fehlt.join(', ') }, 400)
    const b = await req.json().catch(() => ({}))
    const a = b.aktion, auth = req.headers.get('authorization')

    // für Benachrichtigungen: neue Mails im Posteingang seit einem Zeitpunkt
    if (a === 'neu') {
      const seit = /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(String(b.seit || '')) ? b.seit : new Date(Date.now() - 600e3).toISOString()
      const j = await graph(BOX() + "/mailFolders/inbox/messages?$top=20&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,isRead&$filter=receivedDateTime gt " + seit)
      return antwort({ mails: (j.value || []).map(m => ({ id: m.id, betreff: m.subject || '', von: adr(m.from), datum: m.receivedDateTime, gelesen: !!m.isRead })) })
    }

    if (a === 'ordner') return antwort({ postfach: POSTFACH(), ordner: await alleOrdner() })

    if (a === 'liste') {
      const top = Math.min(Number(b.anzahl) || 50, 100), skip = Math.max(Number(b.skip) || 0, 0)
      const such = String(b.suche || '').replace(/["\\]/g, ' ').trim()
      let url
      if (such) url = BOX() + (b.ordner && !b.ueberall ? '/mailFolders/' + encodeURIComponent(b.ordner) : '') + '/messages?$top=' + top + '&$select=' + LISTFELDER + '&$search=' + encodeURIComponent('"' + such + '"')
      else url = BOX() + '/mailFolders/' + encodeURIComponent(b.ordner || 'inbox') + '/messages?$top=' + top + '&$skip=' + skip + '&$orderby=receivedDateTime desc&$select=' + LISTFELDER
      if (b.weiter && String(b.weiter).startsWith('https://graph.microsoft.com/')) url = b.weiter
      const j = await graph(url)
      return antwort({ mails: (j.value || []).map(kurz), weiter: j['@odata.nextLink'] || '' })
    }

    if (a === 'lesen') {
      const id = encodeURIComponent(String(b.id || ''))
      const m = await graph(BOX() + '/messages/' + id + '?$select=' + LISTFELDER + ',body,bccRecipients,replyTo&$expand=attachments($select=id,name,size,contentType,isInline)')
      const anh = (m.attachments || []).map(x => ({ id: x.id, name: x.name, groesse: x.size || 0, typ: x.contentType || '', inline: !!x.isInline, art: (x['@odata.type'] || '').split('.').pop() }))
      let html = m.body && m.body.contentType === 'html' ? m.body.content : '<pre style="white-space:pre-wrap;font:inherit">' + htmlText(m.body && m.body.content) + '</pre>'
      // eingebettete Bilder (cid:) direkt in die Mail einsetzen
      for (const x of anh.filter(x => x.inline && x.groesse < 1.5 * 1024 * 1024 && x.art === 'fileAttachment')) {
        try {
          const f = await graph(BOX() + '/messages/' + id + '/attachments/' + encodeURIComponent(x.id))
          if (f.contentId && f.contentBytes) html = html.split('cid:' + f.contentId).join('data:' + (f.contentType || 'image/png') + ';base64,' + f.contentBytes)
        } catch {}
      }
      if (!m.isRead && b.markieren !== false) { try { await graph(BOX() + '/messages/' + id, { method: 'PATCH', json: { isRead: true } }) } catch {} }
      return antwort({ mail: Object.assign(kurz(m), { gelesen: true, bcc: (m.bccRecipients || []).map(adr), antwortAn: (m.replyTo || []).map(adr), html, anhaenge: anh.filter(x => !x.inline || x.art !== 'fileAttachment') }) })
    }

    if (a === 'anhang') {
      const basis = BOX() + '/messages/' + encodeURIComponent(String(b.id || '')) + '/attachments/' + encodeURIComponent(String(b.aid || ''))
      const meta = await graph(basis + '?$select=id,name,contentType,size')
      const r = await fetch('https://graph.microsoft.com/v1.0' + basis + '/$value', { headers: { Authorization: 'Bearer ' + (await graphToken()) }, cache: 'no-store' })
      if (!r.ok) throw new Error('Anhang nicht lesbar (' + r.status + ').')
      return antwort({ name: meta.name, typ: meta.contentType || 'application/octet-stream', daten: Buffer.from(await r.arrayBuffer()).toString('base64') })
    }

    if (a === 'mime') {
      const id = b.id ? String(b.id) : await perMsgId(b.msgId)
      if (!id) return antwort({ error: 'Mail nicht gefunden.' }, 404)
      return antwort({ mime: await graph(BOX() + '/messages/' + encodeURIComponent(id) + '/$value', { roh: true }) })
    }

    if (a === 'markieren') {
      const patch = {}
      if (b.gelesen != null) patch.isRead = !!b.gelesen
      if (b.markiert != null) patch.flag = { flagStatus: b.markiert ? 'flagged' : 'notFlagged' }
      for (const id of ids(b)) await graph(BOX() + '/messages/' + encodeURIComponent(id), { method: 'PATCH', json: patch })
      return antwort({ ok: true })
    }

    // Tags = Outlook-Kategorien. Liste der Kategorien des Postfachs (braucht MailboxSettings.Read, sonst leer)
    if (a === 'tagliste') {
      try { const j = await graph(BOX() + '/outlook/masterCategories'); return antwort({ tags: (j.value || []).map(c => ({ name: c.displayName, farbe: c.color || '' })) }) }
      catch (e) { return antwort({ tags: [], hinweis: 'Kategorienliste nicht lesbar (Berechtigung MailboxSettings.Read fehlt).' }) }
    }

    if (a === 'tag') {
      const hinzu = (Array.isArray(b.hinzu) ? b.hinzu : []).map(x => String(x).trim()).filter(Boolean).slice(0, 10)
      const weg = (Array.isArray(b.weg) ? b.weg : []).map(String)
      const out = {}
      for (const id of ids(b)) {
        const m = await graph(BOX() + '/messages/' + encodeURIComponent(id) + '?$select=categories')
        const k = [...new Set((m.categories || []).filter(x => !weg.includes(x)).concat(hinzu))]
        await graph(BOX() + '/messages/' + encodeURIComponent(id), { method: 'PATCH', json: { categories: k } })
        out[id] = k
      }
      return antwort({ ok: true, kategorien: out })
    }

    if (a === 'verschieben') {
      const ziel = String(b.ziel || ''); if (!ziel) return antwort({ error: 'Zielordner fehlt.' }, 400)
      for (const id of ids(b)) await graph(BOX() + '/messages/' + encodeURIComponent(id) + '/move', { method: 'POST', json: { destinationId: ziel } })
      return antwort({ ok: true })
    }

    if (a === 'loeschen') {
      // wie Outlook: erst in „Gelöschte Elemente“, dort endgültig löschen
      const wk = await wellKnown(), del = Object.keys(wk).find(k => wk[k] === 'deleteditems')
      for (const id of ids(b)) {
        const m = await graph(BOX() + '/messages/' + encodeURIComponent(id) + '?$select=parentFolderId')
        if (m.parentFolderId === del) await graph(BOX() + '/messages/' + encodeURIComponent(id), { method: 'DELETE' })
        else await graph(BOX() + '/messages/' + encodeURIComponent(id) + '/move', { method: 'POST', json: { destinationId: 'deleteditems' } })
      }
      return antwort({ ok: true })
    }

    if (a === 'senden') {
      let modus = ['neu', 'antworten', 'allen', 'weiterleiten'].includes(b.modus) ? b.modus : 'neu'
      // Antwort auf eine im Mieterkonto hinterlegte Mail: liegt sie nicht in diesem Postfach, als neue Mail senden
      if (modus !== 'neu' && !b.bezug && b.bezugMsgId && b.fallbackNeu) { try { b.bezug = await perMsgId(b.bezugMsgId) } catch {} if (!b.bezug) modus = 'neu' }
      const an = empf(b.an), cc = empf(b.cc), bcc = empf(b.bcc)
      if (!an.length) return antwort({ error: 'Bitte mindestens einen Empfänger eintragen.' }, 400)
      const anh = []
      for (const x of (b.anhaenge || []).slice(0, 20)) anh.push(await anhangLaden(x, auth))
      const eigen = '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt">' + htmlText(b.text) + '</div>'
      let entwurf
      if (modus === 'neu') entwurf = await graph(BOX() + '/messages', { method: 'POST', json: { subject: String(b.betreff || ''), body: { contentType: 'HTML', content: eigen } } })
      else {
        let bezug = b.bezug ? String(b.bezug) : ''
        if (!bezug && b.bezugMsgId) bezug = await perMsgId(b.bezugMsgId)
        if (!bezug) return antwort({ error: 'Die ursprüngliche Mail wurde im Postfach nicht gefunden.' }, 404)
        const fn = modus === 'antworten' ? 'createReply' : modus === 'allen' ? 'createReplyAll' : 'createForward'
        entwurf = await graph(BOX() + '/messages/' + encodeURIComponent(bezug) + '/' + fn, { method: 'POST', json: {} })
        entwurf = await graph(BOX() + '/messages/' + encodeURIComponent(entwurf.id) + '?$select=id,body,internetMessageId')
        const zitat = entwurf.body && entwurf.body.content || ''
        b.htmlNeu = /<body[^>]*>/i.test(zitat) ? zitat.replace(/<body([^>]*)>/i, '<body$1>' + eigen + '<br>') : eigen + '<br>' + zitat
      }
      const basis = BOX() + '/messages/' + encodeURIComponent(entwurf.id)
      const patch = { toRecipients: an, ccRecipients: cc, bccRecipients: bcc }
      if (b.betreff != null && modus !== 'neu') patch.subject = String(b.betreff)
      if (b.htmlNeu) patch.body = { contentType: 'HTML', content: b.htmlNeu }
      await graph(basis, { method: 'PATCH', json: patch })
      try { for (const f of anh) await anhaengen(basis, f) }
      catch (e) { try { await graph(basis, { method: 'DELETE' }) } catch {} throw e }
      const info = await graph(basis + '?$select=internetMessageId')
      await graph(basis + '/send', { method: 'POST' })
      let mime = ''
      if (b.mime && info.internetMessageId) {
        for (let i = 0; i < 6 && !mime; i++) {
          await new Promise(r => setTimeout(r, 1200))
          try { const id = await perMsgId(info.internetMessageId, 'sentitems'); if (id) mime = await graph(BOX() + '/messages/' + encodeURIComponent(id) + '/$value', { roh: true }) } catch {}
        }
      }
      return antwort({ ok: true, von: POSTFACH(), msgId: info.internetMessageId || '', mime })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    const m = String(e && e.message || e)
    const hinweis = e && (e.status === 403 || e.status === 401) || /access ?denied|forbidden/i.test(m) ? ' – In Entra fehlt vermutlich die Berechtigung Mail.ReadWrite bzw. Mail.Send (Anwendung, mit Administratorzustimmung).' : ''
    return antwort({ error: m + hinweis }, e && e.status === 404 ? 404 : 500)
  }
}
