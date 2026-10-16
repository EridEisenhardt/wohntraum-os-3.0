'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Cockpit: Auswahl des Arbeitsbereichs. Die Liste der Bereiche liefert das Menü (je nach Rechten).
export default function Cockpit() {
  const [daten, setDaten] = useState({ aktiv: '', liste: [] })

  useEffect(() => {
    const lies = () => { if (window.__osBereiche) setDaten(window.__osBereiche) }
    lies()
    window.addEventListener('os-bereiche', lies)
    return () => window.removeEventListener('os-bereiche', lies)
  }, [])

  const waehle = (v) => {
    try { localStorage.setItem('os_bereich', v) } catch (e) {}
    try { window.dispatchEvent(new Event('os-bereich')) } catch (e) {}
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Cockpit</h1>
          <div className="date">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="actions">
          <Link href="/verbesserungen" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#185fa5', color: '#fff', borderRadius: 9, padding: '9px 15px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
            Verbesserungswünsche
          </Link>
        </div>
      </div>

      <div className="sub" style={{ marginBottom: 10 }}>Arbeitsbereich wählen – links im Menü erscheinen dann die passenden Punkte.</div>
      <div className="bereiche">
        {daten.liste.map((b) => (
          <button key={b.v} className={'bereich-karte' + (daten.aktiv === b.v ? ' on' : '')} onClick={() => waehle(b.v)}>
            <div className="t">{b.label}</div>
            <div className="d">{b.text}</div>
            <div className="k">{b.kategorien.map((k) => <span key={k}>{k}</span>)}</div>
            {daten.aktiv === b.v && <div className="akt">Aktiver Bereich</div>}
          </button>
        ))}
        {!daten.liste.length && <div className="sub">Lade …</div>}
      </div>
    </>
  )
}
