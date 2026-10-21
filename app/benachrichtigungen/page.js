'use client'
import { useEffect, useState } from 'react'
import { BEREICHE, TOENE, einstellungen, speichern, spiele } from '@/lib/toene'

export default function BenachrichtigungenPage() {
  const [e, setE] = useState(null)
  const [erlaubnis, setErlaubnis] = useState('')
  const [hinweis, setHinweis] = useState('')
  useEffect(() => { setE(einstellungen()); setErlaubnis(typeof Notification === 'undefined' ? 'nicht' : Notification.permission) }, [])
  if (!e) return null
  const setze = (n) => { setE(n); speichern(n); setHinweis('Gespeichert.'); setTimeout(() => setHinweis(''), 1500) }
  const bereich = (id, teil) => setze({ ...e, [id]: { ...e[id], ...teil } })
  const tonName = (id) => (TOENE.find(t => t.id === id) || {}).name || ''
  const desktop = async (an) => {
    if (an && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission(); setErlaubnis(p)
      if (p !== 'granted') { setHinweis('Der Browser hat die Mitteilungen nicht erlaubt.'); return }
    }
    setze({ ...e, desktop: an })
  }
  return (
    <>
      <div className="pagehead"><div><h1>Benachrichtigungen</h1>
        <div className="sub">Ton und Hinweis unten rechts, sobald etwas Neues eingeht. Jeder Bereich hat seinen eigenen Ton. Die Einstellung gilt für diesen Computer.</div></div></div>
      <div className="card" style={{ maxWidth: 720 }}>
        <datalist id="dl-toene">{TOENE.map(t => <option key={t.id} value={t.name} />)}</datalist>
        {BEREICHE.map(b => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.4fr auto', gap: 12, alignItems: 'end', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!e[b.id].an} onChange={ev => bereich(b.id, { an: ev.target.checked })} style={{ width: 18, height: 18 }} />
              <span><b>{b.name}</b>{b.id === 'cliq' && <div className="sub">aktiv, sobald Cliq mit dem OS verbunden ist</div>}</span>
            </label>
            <div className="field" style={{ margin: 0 }}>
              <label>Ton</label>
              <input list="dl-toene" defaultValue={tonName(e[b.id].ton)} key={b.id + e[b.id].ton}
                onFocus={ev => { ev.target.dataset.alt = ev.target.value; ev.target.value = '' }}
                onBlur={ev => { if (!ev.target.value) ev.target.value = ev.target.dataset.alt || '' }}
                onChange={ev => { const t = TOENE.find(x => x.name === ev.target.value); if (t) { bereich(b.id, { ton: t.id }); spiele(t.id, e.laut) } }}
                style={{ width: '100%' }} />
            </div>
            <button className="btn-ghost" type="button" onClick={() => spiele(e[b.id].ton, e.laut)}>Anhören</button>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.4fr auto', gap: 12, alignItems: 'center', padding: '14px 0 4px' }}>
          <b>Lautstärke</b>
          <input type="range" min="0.1" max="1" step="0.1" value={e.laut} onChange={ev => setze({ ...e, laut: Number(ev.target.value) })} />
          <span className="sub">{Math.round(e.laut * 100)} %</span>
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!e.desktop} onChange={ev => desktop(ev.target.checked)} style={{ width: 18, height: 18 }} />
          <span><b>Auch als Mitteilung am Computer</b><div className="sub">wenn das OS im Hintergrund offen ist{erlaubnis === 'denied' ? ' · im Browser blockiert, bitte in den Website-Einstellungen erlauben' : ''}</div></span>
        </label>
        {hinweis && <p className="sub" style={{ color: 'var(--brand)', marginBottom: 0 }}>{hinweis}</p>}
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="sub">Gut zu wissen: Das OS muss in einem Browserfenster geöffnet sein, damit Töne kommen. Neue Mails und Störungen werden etwa alle 45 Sekunden abgefragt. Eigene Einträge lösen keinen Ton aus. Hast du das OS in mehreren Fenstern offen, klingelt es trotzdem nur einmal.</div>
      </div>
    </>
  )
}
