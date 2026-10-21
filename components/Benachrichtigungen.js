'use client'
// Benachrichtigungen im OS: neue Mails, neue Störungsmeldungen (später Cliq) mit eigenem Ton je Bereich.
// Läuft im Hauptfenster des OS. Bei mehreren offenen OS-Fenstern fragt nur eines ab (kein doppelter Ton).
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BEREICHE, einstellungen, spiele, tonFreischalten } from '@/lib/toene'

const KURZ = { 'ramona@andersmacher.info': 'Ramona', 'juergen@andersmacher.info': 'Jürgen', 'eric@andersmacher.info': 'Eric' }
const LANG = { 'ramona@andersmacher.info': 'Ramona Romanelli', 'juergen@andersmacher.info': 'Jürgen Reuter', 'eric@andersmacher.info': 'Eric Eisenhardt' }
const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} } }

export default function Benachrichtigungen({ session }) {
  const [hinweise, setHinweise] = useState([])
  const ich = useRef(Math.random().toString(36).slice(2))

  useEffect(() => { tonFreischalten() }, [])

  useEffect(() => {
    if (!session) return
    const mail = String(session.user && session.user.email || '').toLowerCase()
    const eigene = [KURZ[mail], LANG[mail], mail].filter(Boolean)
    let aus = false

    // nur ein OS-Fenster fragt ab
    const fuehrend = () => {
      const l = ls.get('os_notif_leiter', null), jetzt = Date.now()
      if (!l || l.id === ich.current || jetzt - l.t > 90000) { ls.set('os_notif_leiter', { id: ich.current, t: jetzt }); return true }
      return false
    }
    const schonGemeldet = (id) => { const L = ls.get('os_notif_ids', []); if (L.includes(id)) return true; L.push(id); ls.set('os_notif_ids', L.slice(-300)); return false }
    const seit = (b) => { const s = ls.get('os_notif_seit_' + b, null); if (s) return s; const n = new Date().toISOString(); ls.set('os_notif_seit_' + b, n); return n }

    const melden = (bereich, eintraege) => {
      const e = einstellungen(), B = BEREICHE.find(x => x.id === bereich)
      const neu = eintraege.filter(x => !schonGemeldet(bereich + ':' + x.id))
      if (!neu.length || !e[bereich] || !e[bereich].an) return
      spiele(e[bereich].ton, e.laut)
      const titel = bereich === 'mail' ? (neu.length === 1 ? 'Neue Mail' : neu.length + ' neue Mails') : bereich === 'stoerung' ? (neu.length === 1 ? 'Neue Störungsmeldung' : neu.length + ' neue Störungsmeldungen') : 'Neue Nachricht in Cliq'
      const text = neu.slice(0, 3).map(x => x.text).join('\n')
      setHinweise(h => [{ id: bereich + Date.now(), bereich, titel, text, pfad: B && B.pfad }, ...h].slice(0, 4))
      if (e.desktop && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        try { const n = new Notification(titel, { body: text, tag: 'os-' + bereich, silent: true }); n.onclick = () => { window.focus(); if (B && B.pfad) window.postMessage({ osOeffne: B.pfad }, location.origin); n.close() } } catch (x) {}
      }
    }

    const mails = async () => {
      const e = einstellungen(); if (!e.mail.an) return
      const s = seit('mail')
      const r = await fetch('/api/postfach', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ aktion: 'neu', seit: s }) })
      const j = await r.json().catch(() => null); if (!j || j.error) return
      const L = (j.mails || []).filter(m => !m.gelesen)
      const max = (j.mails || []).reduce((a, m) => m.datum > a ? m.datum : a, s); ls.set('os_notif_seit_mail', max)
      melden('mail', L.map(m => ({ id: m.id, text: (m.von.name || m.von.mail || 'Unbekannt') + ': ' + (m.betreff || '(kein Betreff)') })))
    }
    const stoerungen = async () => {
      const e = einstellungen(); if (!e.stoerung.an) return
      const s = seit('stoerung')
      const { data, error } = await supabase.from('stoerungen').select('id,nr,titel,melder_name,erfasst_von,created_at').gt('created_at', s).order('created_at').limit(20)
      if (error || !data) return
      if (data.length) ls.set('os_notif_seit_stoerung', data[data.length - 1].created_at)
      melden('stoerung', data.filter(x => !eigene.includes(x.erfasst_von)).map(x => ({ id: x.id, text: 'ST-' + String(x.nr || 0).padStart(5, '0') + ' · ' + (x.titel || '') + (x.melder_name ? ' (' + x.melder_name + ')' : '') })))
    }
    const runde = async () => {
      if (aus || !fuehrend()) return
      try { await stoerungen() } catch (x) {}
      try { await mails() } catch (x) {}
    }
    const t0 = setTimeout(runde, 4000), iv = setInterval(runde, 45000)
    return () => { aus = true; clearTimeout(t0); clearInterval(iv) }
  }, [session])

  // Hinweise nach 12 Sekunden ausblenden
  useEffect(() => {
    if (!hinweise.length) return
    const t = setTimeout(() => setHinweise(h => h.slice(0, -1)), 12000)
    return () => clearTimeout(t)
  }, [hinweise])

  if (!hinweise.length) return null
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 9999, display: 'grid', gap: 8, width: 330 }}>
      {hinweise.map(h => (
        <div key={h.id} style={{ background: '#fff', border: '1px solid #e0e5eb', borderLeft: '4px solid ' + (h.bereich === 'stoerung' ? '#b42318' : h.bereich === 'cliq' ? '#1d7a4c' : '#2f5d8a'), borderRadius: 10, boxShadow: '0 10px 30px rgba(20,25,35,.18)', padding: '10px 12px', font: '13px/1.4 system-ui,sans-serif', color: '#18202c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <b>{h.titel}</b>
            <button onClick={() => setHinweise(x => x.filter(y => y.id !== h.id))} style={{ border: 0, background: 'transparent', color: '#5f6b7a', cursor: 'pointer', fontSize: 12 }}>Schließen</button>
          </div>
          <div style={{ whiteSpace: 'pre-line', color: '#5f6b7a', marginTop: 2, overflow: 'hidden', maxHeight: 60 }}>{h.text}</div>
          {h.pfad && <button onClick={() => { window.postMessage({ osOeffne: h.pfad }, location.origin); setHinweise(x => x.filter(y => y.id !== h.id)) }} style={{ marginTop: 6, border: '1px solid #2f5d8a', background: '#2f5d8a', color: '#fff', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12.5 }}>Öffnen</button>}
        </div>
      ))}
    </div>
  )
}
