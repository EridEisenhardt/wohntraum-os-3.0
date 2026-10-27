'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Hilfe im Bereich Verwalto:
// 1. lädt /os-hilfe.js in jede eingebettete OS-Seite (auch in Seiten innerhalb der Reiter), dort werden Erläuterungen ausgeblendet und gesammelt
// 2. Knopf „Hilfe“ oben rechts (wie „Als Favorit“): Anleitung zum Bereich, Hinweise der Seite, Link zur Anleitung mit Video
// Im Bereich „Eric“ gibt es keinen Knopf und keine ausgeblendeten Texte.
const SRC = '/os-hilfe.js?v=20261027b'
function einbauen(f) {
  try {
    const w = f.contentWindow, d = f.contentDocument
    if (!w || !d) return
    if (!f.__osHilfe) { f.__osHilfe = true; f.addEventListener('load', () => einbauen(f)) }
    if (d.readyState === 'loading' || !d.head) return
    if (/\.html$/.test(w.location.pathname) && !d.getElementById('os-hilfe-js')) {
      const s = d.createElement('script'); s.id = 'os-hilfe-js'; s.src = SRC; d.head.appendChild(s)
    }
    d.querySelectorAll('iframe').forEach(einbauen)
  } catch (e) {}
}
// sichtbare (aktive) eingebettete Seite finden
function aktiveSeite() {
  const sichtbar = (f) => f && f.offsetParent !== null && f.getBoundingClientRect().width > 0
  const aussen = [...document.querySelectorAll('main iframe')].find(sichtbar)
  if (!aussen) return null
  try {
    const innen = [...(aussen.contentDocument ? aussen.contentDocument.querySelectorAll('iframe') : [])].find(sichtbar)
    return (innen || aussen).contentWindow
  } catch (e) { return null }
}
let ANL = null
export default function HilfeInjektor() {
  const path = usePathname()
  const [bereich, setBereich] = useState('')
  const [offen, setOffen] = useState(null)
  useEffect(() => {
    const lies = () => { try { setBereich(localStorage.getItem('os_bereich') || '') } catch (e) {} }
    lies(); window.addEventListener('os-bereich', lies); window.addEventListener('storage', lies)
    const pruefe = () => document.querySelectorAll('iframe').forEach(einbauen)
    pruefe(); const iv = setInterval(pruefe, 1500)
    const esc = (e) => { if (e.key === 'Escape') setOffen(null) }
    window.addEventListener('keydown', esc)
    return () => { clearInterval(iv); window.removeEventListener('os-bereich', lies); window.removeEventListener('storage', lies); window.removeEventListener('keydown', esc) }
  }, [])
  if (bereich === 'eric') return null

  async function oeffnen() {
    if (!ANL) { try { ANL = await (await fetch('/anleitungen/anleitungen.json', { cache: 'no-cache' })).json() } catch (e) { ANL = [] } }
    const p = String(path || '').split('?')[0]
    const a = (ANL || []).filter((x) => x.href && x.href !== '/' && (p === x.href || p.startsWith(x.href + '/'))).sort((x, y) => y.href.length - x.href.length)[0] || null
    let texte = []
    try { const w = aktiveSeite(); if (w && w.__osHilfeTexte) texte = w.__osHilfeTexte() } catch (e) {}
    let zeigen = false; try { zeigen = localStorage.getItem('os_hilfe_zeigen') === '1' } catch (e) {}
    setOffen({ a, texte, zeigen })
  }
  function zeigenUmschalten() {
    const neu = !offen.zeigen
    try { localStorage.setItem('os_hilfe_zeigen', neu ? '1' : '0') } catch (e) {}
    setOffen(null)
  }
  const a = offen && offen.a
  return (
    <>
      <button className="favtoggle hilfeknopf" onClick={oeffnen} title="Anleitung und Hinweise zu dieser Seite">
        <span className="favtoggle-lbl">Hilfe</span>
      </button>
      {offen && (
        <div className="hilfe-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) setOffen(null) }}>
          <div className="hilfe-box">
            <h3>{a ? a.titel : 'Hilfe'}</h3>
            {a && <div>{a.wofuer}</div>}
            {a && a.schritte && a.schritte.length > 0 && (<><h4>So arbeitest du damit</h4><ol>{a.schritte.map((s, i) => <li key={i}>{s}</li>)}</ol></>)}
            {a && a.tipps && a.tipps.length > 0 && (<><h4>Gut zu wissen</h4><ul>{a.tipps.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
            {offen.texte.length > 0 && (<><h4>Hinweise auf dieser Seite</h4><ul>{offen.texte.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
            {!a && !offen.texte.length && <div className="hilfe-m">Für diese Seite gibt es noch keine Anleitung.</div>}
            <div className="hilfe-k">
              <button className="hilfe-p" onClick={() => { setOffen(null); window.location.href = '/verwalto/anleitungen' + (a ? '?bereich=' + encodeURIComponent(a.slug) : '') }}>
                {a ? (a.video ? 'Anleitung mit Video öffnen' : 'Anleitung öffnen') : 'Alle Anleitungen'}
              </button>
              <button onClick={zeigenUmschalten}>{offen.zeigen ? 'Hinweise auf der Seite ausblenden' : 'Hinweise auf der Seite einblenden'}</button>
              <button style={{ marginLeft: 'auto' }} onClick={() => setOffen(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
