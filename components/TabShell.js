'use client'
// Geöffnete Bereiche als Tabs: jede Seite läuft in einem eigenen Rahmen und bleibt im Hintergrund erhalten,
// solange der Tab offen ist (z. B. ein geöffnetes Mieterkonto, während man in den Buchungen nachschaut).
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NAV, farbeFuerPfad } from './Sidebar'

const MAX = 10
const SPEICHER = 'os_tabs'
const FEST = 'os_tabs_fest' // angeheftete Reiter: bleiben dauerhaft offen (auch nach dem Schließen des Browsers)
const festLesen = () => { try { const L = JSON.parse(localStorage.getItem(FEST) || '[]'); return Array.isArray(L) ? L.filter((t) => t && t.key && t.pfad) : [] } catch (e) { return [] } }
const festSchreiben = (L) => { try { localStorage.setItem(FEST, JSON.stringify(L)) } catch (e) {} }
const blaetter = []
NAV.forEach((n) => {
  if (n.type === 'link') blaetter.push({ href: n.href, label: n.label })
  else if (n.type === 'group') (n.items || []).forEach((it) => blaetter.push({ href: it.href, label: it.label }))
})
function labelFuer(pfad) {
  const p = pfad.split('?')[0]
  const exakt = blaetter.find((x) => x.href === p)
  if (exakt) return exakt.label
  const k = blaetter.filter((x) => x.href !== '/' && p.startsWith(x.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]
  if (k) return k.label
  if (p === '/verwalto/objekt') return 'Objekt'
  const t = p.split('/').filter(Boolean).pop() || 'Cockpit'
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')
}
// Tab-Schlüssel: Pfad, bei Detailseiten mit ?id= auch die ID (zwei Objekte = zwei Tabs)
function schluessel(pfad) {
  const [p, q] = pfad.split('?'); const id = new URLSearchParams(q || '').get('id')
  return p + (id ? '?id=' + id : '')
}
const mitTab = (pfad) => pfad + (pfad.includes('?') ? '&' : '?') + 'ostab=1'
const ohneTab = (pfad) => pfad.replace(/([?&])ostab=1(&|$)/, (m, a, b) => (b ? a : '')).replace(/[?&]$/, '')

export default function TabShell() {
  const pfadname = usePathname()
  const router = useRouter()
  const [tabs, setTabs] = useState([])
  const [aktiv, setAktiv] = useState('')
  const geladen = useRef(false)
  const rahmen = useRef({})
  const umleiten = useRef(false)
  const [fest, setFest] = useState([]) // Schlüssel der angehefteten Reiter
  const festRef = useRef([]); festRef.current = fest
  const [menue, setMenue] = useState(null) // Kontextmenü {x, y, key}

  // gespeicherte Tabs nach dem Neuladen wiederherstellen
  // Neuer Start des OS (frische Browsersitzung): immer mit dem Cockpit beginnen, außer bei einem gezielten Link (mit ?…)
  useEffect(() => {
    let s = null
    try { s = JSON.parse(sessionStorage.getItem(SPEICHER) || 'null') } catch (e) {}
    const F = festLesen(); setFest(F.map((t) => t.key))
    const mitFest = (L) => { const da = new Set(L.map((t) => t.key)); return F.filter((t) => !da.has(t.key)).map((t, i) => ({ key: t.key, pfad: t.pfad, titel: t.titel || labelFuer(t.pfad), pos: -100 + i })).concat(L) }
    if (s && Array.isArray(s.tabs)) setTabs(mitFest(s.tabs.slice(0, MAX)))
    else { setTabs(mitFest([])); if (window.location.pathname !== '/' && !window.location.search) { geladen.current = true; umleiten.current = true; router.replace('/'); return } }
    geladen.current = true
  }, [])
  useEffect(() => { if (geladen.current) try { sessionStorage.setItem(SPEICHER, JSON.stringify({ tabs })) } catch (e) {} }, [tabs])

  // Adresse → passenden Tab öffnen oder anlegen
  const oeffne = (roh) => {
    const voll = ohneTab(roh)
    const k = schluessel(voll)
    setTabs((alt) => {
      const da = alt.find((t) => t.key === k)
      if (da) {
        if (da.pfad !== voll && voll.includes('?')) return alt.map((t) => (t.key === k ? Object.assign({}, t, { pfad: voll, v: (t.v || 0) + 1 }) : t))
        return alt
      }
      const pos = alt.reduce((m, t, i) => Math.max(m, t.pos || i + 1), 0) + 1
      let L = alt.concat([{ key: k, pfad: voll, titel: labelFuer(voll), pos }])
      if (L.length > MAX + festRef.current.length) { const weg = L.find((t) => t.key !== k && !festRef.current.includes(t.key)); if (weg) L = L.filter((t) => t !== weg) }
      return L
    })
    setAktiv(k)
  }
  const oeffneRef = useRef(oeffne); oeffneRef.current = oeffne
  useEffect(() => { if (umleiten.current) { if (pfadname !== '/') return; umleiten.current = false } oeffne(pfadname + window.location.search) }, [pfadname])
  const geh = (p) => { const v = ohneTab(p); router.push(v); oeffneRef.current(v) }

  // Navigation aus eingebetteten Seiten abfangen: statt die ganze Seite neu zu laden, Tab öffnen
  useEffect(() => {
    const nav = window.navigation
    const oPush = history.pushState, oRep = history.replaceState
    let intern = false
    history.pushState = function () { intern = true; try { return oPush.apply(this, arguments) } finally { intern = false } }
    history.replaceState = function () { intern = true; try { return oRep.apply(this, arguments) } finally { intern = false } }
    const h = (e) => {
      if (intern || e.hashChange || e.downloadRequest || !e.canIntercept || !e.cancelable) return
      if (e.navigationType === 'reload' || e.navigationType === 'traverse') return
      const u = new URL(e.destination.url)
      if (u.origin !== location.origin || u.pathname.startsWith('/api/') || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) return
      e.preventDefault(); geh(u.pathname + u.search)
    }
    if (nav) nav.addEventListener('navigate', h)
    const msg = (e) => { if (e.origin === location.origin && e.data && e.data.osOeffne) geh(String(e.data.osOeffne)) }
    window.addEventListener('message', msg)
    return () => { if (nav) nav.removeEventListener('navigate', h); window.removeEventListener('message', msg); history.pushState = oPush; history.replaceState = oRep }
  }, [router])

  // Titel für Detailseiten (z. B. Objekt) aus der eingebetteten Seite übernehmen
  useEffect(() => {
    const t = setInterval(() => {
      setTabs((alt) => {
        let anders = false
        const neu = alt.map((tab) => {
          if (labelFuer(tab.pfad) !== 'Objekt') return tab
          try {
            const f = rahmen.current[tab.key]; const innen = f && f.contentDocument && f.contentDocument.querySelector('iframe')
            const ti = innen && innen.contentDocument && innen.contentDocument.title
            if (ti && ti !== tab.titel && !/^Objekt$/.test(ti)) { anders = true; return Object.assign({}, tab, { titel: ti }) }
          } catch (e) {}
          return tab
        })
        return anders ? neu : alt
      })
    }, 2500)
    return () => clearInterval(t)
  }, [])

  const wechseln = (t) => { if (t.key === aktiv) return; setAktiv(t.key); router.push(t.pfad) }
  const anheften = (t, an) => {
    const L = festLesen().filter((x) => x.key !== t.key)
    if (an) L.push({ key: t.key, pfad: t.pfad, titel: t.titel })
    festSchreiben(L); setFest(L.map((x) => x.key)); setMenue(null)
  }
  useEffect(() => { if (!menue) return; const zu = () => setMenue(null); window.addEventListener('click', zu); window.addEventListener('blur', zu); return () => { window.removeEventListener('click', zu); window.removeEventListener('blur', zu) } }, [menue])
  const schliessen = (t, e) => {
    if (e) e.stopPropagation()
    if (fest.includes(t.key)) return // angeheftete Reiter erst lösen
    const i = tabs.findIndex((x) => x.key === t.key); const rest = tabs.filter((x) => x.key !== t.key)
    if (!rest.length) { setTabs([]); router.push('/'); return }
    setTabs(rest)
    if (t.key === aktiv) { const n = rest[Math.min(i, rest.length - 1)]; setAktiv(n.key); router.push(n.pfad) }
  }

  // Reiter mit der Maus verschieben: nur die Reihenfolge in der Leiste ändert sich (pos), die Seiten bleiben geladen
  const [zieh, setZieh] = useState(null)
  const [ziel, setZiel] = useState(null)
  const reihe = tabs.map((t, i) => Object.assign({ _i: i }, t)).sort((a, b) => (fest.includes(b.key) - fest.includes(a.key)) || ((a.pos || a._i + 1) - (b.pos || b._i + 1)))
  const ablegen = (k, vor) => {
    if (!zieh || zieh === k) return
    const keys = reihe.map(t => t.key).filter(x => x !== zieh)
    let i = keys.indexOf(k); if (!vor) i++
    keys.splice(i, 0, zieh)
    setTabs(alt => alt.map(t => Object.assign({}, t, { pos: keys.indexOf(t.key) + 1 })))
  }

  return (
    <div className="ostabs-wrap">
      <div className="ostabs" role="tablist">
        {reihe.map((t) => (
          <div key={t.key} role="tab" aria-selected={t.key === aktiv}
            className={'ostab' + (fest.includes(t.key) ? ' fest' : '') + (t.key === aktiv ? ' on' : '') + (zieh === t.key ? ' zieht' : '') + (ziel && ziel.k === t.key && zieh !== t.key ? (ziel.vor ? ' drop-l' : ' drop-r') : '')}
            draggable onDragStart={(e) => { setZieh(t.key); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.titel) } catch (x) {} }}
            onDragOver={(e) => { if (!zieh) return; e.preventDefault(); const b = e.currentTarget.getBoundingClientRect(); const vor = e.clientX < b.left + b.width / 2; if (!ziel || ziel.k !== t.key || ziel.vor !== vor) setZiel({ k: t.key, vor }) }}
            onDrop={(e) => { e.preventDefault(); if (ziel) ablegen(t.key, ziel.vor); setZieh(null); setZiel(null) }}
            onDragEnd={() => { setZieh(null); setZiel(null) }}
            style={(() => { let b = ''; try { b = localStorage.getItem('os_bereich') || '' } catch (x) {} const f = farbeFuerPfad(t.pfad, b); return f ? { '--kc': f } : undefined })()}
            onClick={() => wechseln(t)} onAuxClick={(e) => { if (e.button === 1) schliessen(t, e) }}
            onContextMenu={(e) => { e.preventDefault(); setMenue({ x: e.clientX, y: e.clientY, key: t.key }) }}
            title={t.titel + (fest.includes(t.key) ? ' (angeheftet, Rechtsklick zum Lösen)' : ' (Rechtsklick zum Anheften)')}>
            <span className="ostab-t">{t.titel}</span>
            {fest.includes(t.key)
              ? <span className="ostab-fest">fest</span>
              : <button className="ostab-x" onClick={(e) => schliessen(t, e)} aria-label={t.titel + ' schließen'}>×</button>}
          </div>
        ))}
      </div>
      {menue && (() => { const t = tabs.find((x) => x.key === menue.key); if (!t) return null; const an = fest.includes(t.key)
        return (
          <div className="ostab-menue" style={{ left: Math.min(menue.x, window.innerWidth - 200), top: menue.y }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => anheften(t, !an)}>{an ? 'Reiter lösen' : 'Reiter anheften'}</button>
            {!an && <button onClick={() => { setMenue(null); schliessen(t) }}>Reiter schließen</button>}
          </div>) })()}
      <div className="ostabs-flaeche">
        {tabs.map((t) => (
          <iframe key={t.key + ':' + (t.v || 0)} ref={(el) => { if (el) rahmen.current[t.key] = el }} src={mitTab(t.pfad)} title={t.titel}
            allow="fullscreen; clipboard-write" allowFullScreen
            style={{ display: t.key === aktiv ? 'block' : 'none' }} />
        ))}
      </div>
    </div>
  )
}
