'use client'
// „An Kollegen senden“: Seiten im OS schicken {cliqTeilen:{titel, link}} per postMessage, hier öffnet sich das Fenster zum Senden über Cliq.
import { useEffect, useState } from 'react'

export default function CliqTeilen({ session }) {
  const [d, setD] = useState(null)
  const [ziele, setZiele] = useState(null)
  const [an, setAn] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState('')
  const post = (body) => fetch('/api/cliq', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (session && session.access_token) }, body: JSON.stringify(body) }).then(r => r.json())

  useEffect(() => {
    const h = (e) => {
      if (e.origin !== location.origin || !e.data || !e.data.cliqTeilen) return
      const t = e.data.cliqTeilen
      setD(t); setText((t.titel || '') + '\n' + (t.link || '')); setAn(''); setFehler('')
      if (!ziele) post({ aktion: 'ziele' }).then(j => { if (j.error) { setFehler(j.error); setZiele({ personen: [], kanaele: [], aus: !!j.verbinden }) } else setZiele(j) }).catch(() => setFehler('Cliq nicht erreichbar.'))
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [session, ziele])

  if (!d) return null
  const optionen = ziele ? [...ziele.personen.map(p => ({ label: p.name + ' (Direktnachricht)', an: p.mail })), ...ziele.kanaele.map(k => ({ label: 'Kanal ' + k.name, kanal: k.kanal, chat: k.chat }))] : []
  const senden = async () => {
    const o = optionen.find(x => x.label === an)
    if (!o) { setFehler('Bitte einen Empfänger aus der Liste wählen.'); return }
    if (!text.trim()) return
    setBusy(true); setFehler('')
    try {
      const j = await post(Object.assign({ aktion: 'senden', text }, o.an ? { an: o.an } : o.kanal ? { kanal: o.kanal } : { chat: o.chat }))
      if (j.error) throw new Error(j.error)
      setD(null)
    } catch (e) { setFehler(e.message || String(e)) }
    setBusy(false)
  }
  const feld = { width: '100%', background: '#eef1f5', border: '1px solid #e0e5eb', borderRadius: 7, padding: '8px 10px', font: 'inherit', fontSize: 14 }
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) setD(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,30,.35)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e5eb', width: 480, maxWidth: '100%', padding: '16px 18px', font: '14px/1.45 system-ui,sans-serif', color: '#18202c', boxShadow: '0 20px 50px rgba(20,25,35,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><b style={{ fontSize: 16 }}>An Kollegen senden (Cliq)</b>
          <button onClick={() => setD(null)} style={{ border: 0, background: 'transparent', color: '#5f6b7a', cursor: 'pointer' }}>Schließen</button></div>
        {ziele && ziele.aus ? (
          <div>
            <p style={{ color: '#946200', background: '#fff4d6', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{fehler || 'Dein Cliq-Konto ist noch nicht verbunden.'}</p>
            <button onClick={() => { window.postMessage({ osOeffne: '/verwalto/cliq' }, location.origin); setD(null) }} style={{ marginTop: 10, background: '#2f5d8a', color: '#fff', border: 0, borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Zu Cliq im OS</button>
          </div>
        ) : (
          <div>
            <label style={{ display: 'grid', gap: 3, fontSize: 12, color: '#5f6b7a', marginBottom: 8 }}>An
              <input list="dl-cliq-ziele" value={an} onChange={e => setAn(e.target.value)} placeholder={ziele ? 'Kollege oder Kanal eintippen …' : 'Lädt …'} style={feld} autoFocus />
              <datalist id="dl-cliq-ziele">{optionen.map(o => <option key={o.label} value={o.label} />)}</datalist>
            </label>
            <label style={{ display: 'grid', gap: 3, fontSize: 12, color: '#5f6b7a' }}>Nachricht
              <textarea value={text} onChange={e => setText(e.target.value)} rows={5} style={{ ...feld, resize: 'vertical' }} />
            </label>
            {fehler && <p style={{ color: '#b42318', fontSize: 13, marginTop: 6 }}>{fehler}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button onClick={() => setD(null)} style={{ border: '1px solid #e0e5eb', background: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={senden} disabled={busy} style={{ background: '#2f5d8a', color: '#fff', border: 0, borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>{busy ? 'Sendet …' : 'Senden'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
