// Zoho Cliq im Wohntraum OS: jeder Nutzer verbindet sein eigenes Cliq-Konto (OAuth), danach Chats lesen und schreiben.
// Benötigt in Vercel: CLIQ_CLIENT_ID, CLIQ_CLIENT_SECRET, optional CLIQ_DC (Standard: eu für zoho.eu)
// Weiterleitungs-URL in der Zoho API Console: https://<OS-Domain>/api/cliq/rueckkehr
import { angemeldet, antwort } from '../_lib/auth'
import { DC, ACCOUNTS, SCOPES, bereit, rueckkehr, TEAM, db, konto, stateNeu, statePruefen, tokenTausch, CACHE, zugang, cliq, zeit, text, datei, chatKurz } from '../_lib/cliq'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const user = await angemeldet(req)
    if (!user) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const auth = req.headers.get('authorization')
    const b = await req.json().catch(() => ({}))
    const a = b.aktion

    if (a === 'status') {
      if (!bereit()) return antwort({ eingerichtet: false, verbunden: false, rueckkehr: rueckkehr() })
      const k = await konto(auth)
      return antwort({ eingerichtet: true, rueckkehr: rueckkehr(), client: String(process.env.CLIQ_CLIENT_ID || '').slice(0, 8), dc: DC(), verbunden: !!k, name: k && k.zoho_name, mail: k && k.zoho_mail, id: k && k.zoho_id })
    }
    if (!bereit()) return antwort({ error: 'Cliq ist noch nicht eingerichtet (CLIQ_CLIENT_ID und CLIQ_CLIENT_SECRET fehlen in Vercel).' }, 400)

    if (a === 'verbinden') {
      const p = new URLSearchParams({ scope: SCOPES, client_id: process.env.CLIQ_CLIENT_ID, response_type: 'code', access_type: 'offline', prompt: 'consent', redirect_uri: rueckkehr(req), state: stateNeu(user.id) })
      return antwort({ url: ACCOUNTS() + '/oauth/v2/auth?' + p.toString() })
    }
    if (a === 'code') {
      if (!statePruefen(b.state, user.id)) return antwort({ error: 'Die Anmeldung ist abgelaufen. Bitte noch einmal verbinden.' }, 400)
      const j = await tokenTausch({ grant_type: 'authorization_code', code: String(b.code || ''), redirect_uri: rueckkehr(req) }, b.server)
      if (!j.refresh_token) throw new Error('Zoho hat keinen dauerhaften Zugang geliefert. Bitte noch einmal verbinden.')
      let info = {}
      try { const r = await fetch((b.server && /^https:\/\/accounts\.zoho\.[a-z.]+$/.test(b.server) ? b.server : ACCOUNTS()) + '/oauth/user/info', { headers: { Authorization: 'Zoho-oauthtoken ' + j.access_token }, cache: 'no-store' }); info = await r.json() } catch (e) { }
      await db('cliq_konten?on_conflict=user_id', auth, { method: 'POST', prefer: 'resolution=merge-duplicates', body: { user_id: user.id, refresh_token: j.refresh_token, api_domain: j.api_domain || null, zoho_name: info.Display_Name || [info.First_Name, info.Last_Name].filter(Boolean).join(' ') || null, zoho_mail: info.Email || null, zoho_id: info.ZUID ? String(info.ZUID) : null, updated_at: new Date().toISOString() } })
      CACHE.delete(user.id)
      return antwort({ ok: true, name: info.Display_Name || '' })
    }
    if (a === 'trennen') {
      const k = await konto(auth)
      if (k) { try { await fetch(ACCOUNTS() + '/oauth/v2/token/revoke?token=' + encodeURIComponent(k.refresh_token), { method: 'POST' }) } catch (e) { } }
      await db('cliq_konten?user_id=eq.' + user.id, auth, { method: 'DELETE' })
      CACHE.delete(user.id)
      return antwort({ ok: true })
    }

    const k = await konto(auth)
    if (!k) return antwort({ error: 'Dein Cliq-Konto ist noch nicht mit dem OS verbunden.', verbinden: true }, 400)
    const token = await zugang(user.id, k)

    if (a === 'chats') {
      // Direktchats, Gruppenchats und Kanäle zusammenführen; angeheftete Chats markieren
      const [j, kan, pin] = await Promise.all([
        cliq(token, '/api/v2/chats?limit=100'),
        cliq(token, '/api/v2/channels?joined=true&limit=100').catch(() => ({})),
        cliq(token, '/api/v2/chats?limit=100&pinned=true').catch(() => ({})),
      ])
      const M = new Map()
      for (const c of (j.chats || j.data || [])) { const x = chatKurz(c); if (x.id) M.set(x.id, x) }
      for (const c of (kan.channels || kan.data || [])) {
        const id = c.chat_id; if (!id) continue
        const x = M.get(id) || { id, name: c.name || '', typ: 'channel', geaendert: zeit(c.last_modified_time), letzte: null }
        x.typ = 'channel'; x.kanal = c.unique_name || ''; if (!x.name) x.name = c.name || ''; M.set(id, x)
      }
      for (const c of (pin.chats || pin.data || [])) { const x = M.get(c.chat_id); if (x) x.angeheftet = true }
      const L = [...M.values()].sort((x, y) => (y.letzte ? y.letzte.zeit : y.geaendert) - (x.letzte ? x.letzte.zeit : x.geaendert))
      return antwort({ chats: L, ich: k.zoho_id || '' })
    }
    if (a === 'nachrichten') {
      const id = encodeURIComponent(String(b.chat || ''))
      const q = new URLSearchParams({ limit: String(Math.min(Number(b.anzahl) || 50, 100)) }); if (b.bis) q.set('totime', String(b.bis))
      const j = await cliq(token, '/api/v2/chats/' + id + '/messages?' + q.toString())
      const L = (j.data || []).map(m => ({ id: m.id, von: (m.sender || {}).name || '', vonId: String((m.sender || {}).id || ''), zeit: zeit(m.time), typ: m.type || 'text', text: (datei(m) ? ((m.content || {}).comment || '') : text(m)), datei: datei(m) })).sort((x, y) => x.zeit - y.zeit)
      return antwort({ nachrichten: L, ich: k.zoho_id || '' })
    }
    if (a === 'senden') {
      const t = String(b.text || '').trim().slice(0, 5000); if (!t) return antwort({ error: 'Kein Text.' }, 400)
      let pfad
      if (b.chat) pfad = '/api/v2/chats/' + encodeURIComponent(String(b.chat)) + '/message'
      else if (b.kanal) pfad = '/api/v2/channelsbyname/' + encodeURIComponent(String(b.kanal)) + '/message'
      else if (b.an) pfad = '/api/v2/buddies/' + encodeURIComponent(String(b.an)) + '/message'
      else return antwort({ error: 'Empfänger fehlt.' }, 400)
      const j = await cliq(token, pfad, { method: 'POST', json: { text: t, sync_message: true } })
      return antwort({ ok: true, id: j.message_id || '' })
    }
    if (a === 'ziele') {
      let kanaele = []
      try { const j = await cliq(token, '/api/v2/channels?joined=true&limit=100'); kanaele = (j.channels || j.data || []).map(c => ({ name: c.name || '', kanal: c.unique_name || '', chat: c.chat_id || '' })).filter(c => c.kanal || c.chat) } catch (e) { }
      const ich = String(k.zoho_mail || user.email || '').toLowerCase()
      return antwort({ personen: TEAM.filter(([, m]) => m !== ich).map(([name, mail]) => ({ name, mail })), kanaele })
    }
    if (a === 'neu') {
      const seit = Number(b.seit) || (Date.now() - 600e3)
      const j = await cliq(token, '/api/v2/chats?limit=50&modified_after=' + seit)
      const L = (j.chats || j.data || []).map(chatKurz).filter(c => c.letzte && c.letzte.zeit > seit && c.letzte.vonId !== String(k.zoho_id || ''))
      return antwort({ neu: L, jetzt: Date.now() })
    }
    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ error: String(e && e.message || e) }, 500)
  }
}
