'use client'
// Geöffnete Bereiche als Tabs: jede Seite läuft in einem eigenen Rahmen und bleibt im Hintergrund erhalten,
// solange der Tab offen ist (z. B. ein geöffnetes Mieterkonto, während man in den Buchungen nachschaut).
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NAV } from './Sidebar'

const MAX = 10
const SPEICHER = 'os_tabs'
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

  // gespeicherte Tabs nach dem Neuladen wiederherstellen
  // Neuer Start des OS (frische Browsersitzung): immer mit dem Cockpit beginnen, außer bei einem gezielten Link (mit ?…)
  useEffect(() => {
    let s = null
    try { s = JSON.parse(sessionStorage.getItem(SPEICHER) || 'null') } catch (e) {}
    if (s && Array.isArray(s.tabs)) setTabs(s.tabs.slice(0, MAX))
    else if (window.location.pathname !== '/' && !window.location.search) { geladen.current = true; umleiten.current = true; router.replace('/'); return }
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
      let L = alt.concat([{ key: k, pfad: voll, titel: labelFuer(voll) }])
      if (L.length > MAX) { const weg = L.find((t) => t.key !== k); L = L.filter((t) => t !== weg) }
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
  const schliessen = (t, e) => {
    e.stopPropagation()
    const i = tabs.findIndex((x) => x.key === t.key); const rest = tabs.filter((x) => x.key !== t.key)
    if (!rest.length) { setTabs([]); router.push('/'); return }
    setTabs(rest)
    if (t.key === aktiv) { const n = rest[Math.min(i, rest.length - 1)]; setAktiv(n.key); router.push(n.pfad) }
  }

  return (
    <div className="ostabs-wrap">
      <div className="ostabs" role="tablist">
        {tabs.map((t) => (
          <div key={t.key} role="tab" aria-selected={t.key === aktiv} className={'ostab' + (t.key === aktiv ? ' on' : '')} onClick={() => wechseln(t)} onAuxClick={(e) => { if (e.button === 1) schliessen(t, e) }} title={t.titel}>
            <span className="ostab-t">{t.titel}</span>
            <button className="ostab-x" onClick={(e) => schliessen(t, e)} aria-label={t.titel + ' schließen'}>×</button>
          </div>
        ))}
      </div>
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
