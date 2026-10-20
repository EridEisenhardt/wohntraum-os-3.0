'use client'
import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'

const NAMEN = { 'ramona@andersmacher.info': 'Ramona', 'juergen@andersmacher.info': 'Jürgen', 'eric@andersmacher.info': 'Eric' }

// Das Menü (Sidebar) liegt im Hauptfenster; das Cockpit läuft in einem Tab (eigener Rahmen) und liest die Bereiche von dort.
function hauptfenster() {
  try { if (window.parent && window.parent !== window && window.parent.location.origin === window.location.origin) return window.parent } catch (e) {}
  return window
}
function gruss() { const h = new Date().getHours(); return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend' }

// Cockpit: Begrüßung und Auswahl des Arbeitsbereichs. Die Liste der Bereiche liefert das Menü (je nach Rechten).
export default function Cockpit() {
  const [daten, setDaten] = useState({ aktiv: '', liste: [] })
  const [name, setName] = useState('')
  const [hallo, setHallo] = useState('')

  useEffect(() => {
    setHallo(gruss())
    const H = hauptfenster()
    const lies = () => { if (H.__osBereiche) setDaten(Object.assign({}, H.__osBereiche)) }
    lies()
    H.addEventListener('os-bereiche', lies)
    const t = setInterval(lies, 1500)
    if (supabaseConfigured) supabase.auth.getUser().then(({ data }) => {
      const u = data && data.user; if (!u) return
      const m = String(u.email || '').toLowerCase()
      const n = NAMEN[m] || String((u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || '').split(' ')[0]
      setName(n || '')
    }).catch(() => {})
    return () => { H.removeEventListener('os-bereiche', lies); clearInterval(t) }
  }, [])

  const waehle = (v) => {
    const H = hauptfenster()
    try { localStorage.setItem('os_bereich', v) } catch (e) {}
    try { H.dispatchEvent(new Event('os-bereich')) } catch (e) {}
    setDaten((d) => Object.assign({}, d, { aktiv: v }))
  }
  const geheZu = (href) => {
    const H = hauptfenster()
    if (H !== window) H.postMessage({ osOeffne: href }, window.location.origin)
    else window.location.href = href
  }
  // Kategorie anklicken: Bereich wählen und im Menü nur diese Kategorie aufklappen (einzelne Seiten direkt öffnen)
  const oeffne = (e, v, k) => {
    e.stopPropagation()
    waehle(v)
    if (k.href) { geheZu(k.href); return }
    try { hauptfenster().dispatchEvent(new CustomEvent('os-oeffne', { detail: k.key })) } catch (er) {}
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{hallo ? hallo + (name ? ', ' + name : '') : 'Cockpit'}</h1>
          <div className="date">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Cockpit</div>
        </div>
        <div className="actions">
          <button onClick={() => geheZu('/verbesserungen')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#185fa5', color: '#fff', border: 0, borderRadius: 9, padding: '9px 15px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            Verbesserungswünsche
          </button>
        </div>
      </div>

      <div className="sub" style={{ marginBottom: 10 }}>Arbeitsbereich wählen – links im Menü erscheinen dann die passenden Punkte.</div>
      <div className="bereiche">
        {daten.liste.map((b) => (
          <div key={b.v} role="button" tabIndex={0} className={'bereich-karte' + (daten.aktiv === b.v ? ' on' : '')} onClick={() => waehle(b.v)}>
            <div className="t">{b.label}</div>
            <div className="d">{b.text}</div>
            <div className="k">{b.kategorien.map((k) => <button key={k.label} onClick={(e) => oeffne(e, b.v, k)}>{k.label}</button>)}</div>
            {daten.aktiv === b.v && <div className="akt">Aktiver Bereich</div>}
          </div>
        ))}
        {!daten.liste.length && <div className="sub">Lade …</div>}
      </div>
    </>
  )
}
