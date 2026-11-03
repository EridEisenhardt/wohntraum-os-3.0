'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FARBEN, GROESSEN, HINTERGRUENDE, MODI, STANDARD, lokalLesen, lokalSetzen } from '@/lib/darstellung'

const box = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }
const titel = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', fontWeight: 700, marginBottom: 10 }
const reihe = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const wahl = (an) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 600, background: 'var(--surface)', color: 'var(--text)', border: an ? '2px solid var(--brand)' : '1px solid var(--line)', margin: an ? 0 : 1 })

export default function Page() {
  const [uid, setUid] = useState('')
  const [d, setD] = useState(STANDARD)
  const [info, setInfo] = useState('')
  const [bereich, setBereich] = useState('team')
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session && data.session.user ? data.session.user.id : ''
      setUid(u)
      const l = lokalLesen(); if (l && l.uid === u && l.d) setD({ ...STANDARD, ...l.d })
      if (u) supabase.from('nutzer_einstellungen').select('darstellung').eq('user_id', u).maybeSingle().then(({ data: r }) => { if (r && r.darstellung && Object.keys(r.darstellung).length) setD({ ...STANDARD, ...r.darstellung }) })
    })
    try { const t = window.top; if (t.__osBereiche) setBereich(t.__osBereiche.aktiv) } catch (e) {}
  }, [])
  const setze = async (feld, wert) => {
    const n = { ...d, [feld]: wert }
    setD(n); lokalSetzen(uid, n); setInfo('Wird gespeichert …')
    const { error } = await supabase.from('nutzer_einstellungen').upsert({ user_id: uid, darstellung: n, updated_at: new Date().toISOString() })
    setInfo(error ? 'Fehler beim Speichern: ' + error.message : 'Gespeichert. Gilt auf jedem Gerät, auf dem du angemeldet bist.')
  }
  const zuruecksetzen = async () => {
    const n = { ...STANDARD }
    setD(n); lokalSetzen(uid, n); setInfo('Wird gespeichert …')
    const { error } = await supabase.from('nutzer_einstellungen').upsert({ user_id: uid, darstellung: n, updated_at: new Date().toISOString() })
    setInfo(error ? 'Fehler beim Speichern: ' + error.message : 'Auf Standard zurückgesetzt.')
  }
  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Meine Einstellungen</h1>
      <div style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 18 }}>Diese Einstellungen gelten nur für dich und nur im Bereich Verwalto. Änderungen werden sofort übernommen.</div>
      {bereich && bereich !== 'team' && <div style={{ ...box, borderColor: 'var(--brand)' }}>Du bist gerade im Bereich {bereich === 'eric' ? 'Eric' : bereich}. Dort bleibt die Darstellung unverändert. Wechsle in den Bereich Verwalto, um die Wirkung zu sehen.</div>}
      <div style={box}>
        <div style={titel}>Ansicht</div>
        <div style={reihe}>{MODI.map((m) => (
          <button key={m.v} style={{ ...wahl(d.modus === m.v), ...(m.v === 'dunkel' ? { background: '#1f2329', color: '#e8eaed' } : {}) }} onClick={() => setze('modus', m.v)}>{m.label}</button>))}</div>
      </div>
      <div style={box}>
        <div style={titel}>Farbe</div>
        <div style={reihe}>{FARBEN.map((f) => (
          <button key={f.v} style={wahl(d.farbe === f.v)} onClick={() => setze('farbe', f.v)}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: f.c, display: 'inline-block' }} />{f.label}
          </button>))}</div>
      </div>
      <div style={box}>
        <div style={titel}>Größe von Schrift und Knöpfen</div>
        <div style={reihe}>{GROESSEN.map((g) => (
          <button key={g.v} style={{ ...wahl(d.groesse === g.v), fontSize: Math.round(14 * g.z) }} onClick={() => setze('groesse', g.v)}>{g.label}</button>))}</div>
      </div>
      <div style={box}>
        <div style={titel}>Hintergrund</div>
        <div style={reihe}>{HINTERGRUENDE.map((h) => (
          <button key={h.v} style={wahl(d.hintergrund === h.v)} onClick={() => setze('hintergrund', h.v)}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: h.c || '#f6f7f9', border: '1px solid var(--line)', display: 'inline-block' }} />{h.label}
          </button>))}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn" onClick={zuruecksetzen}>Auf Standard zurücksetzen</button>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{info}</span>
      </div>
    </div>
  )
}
