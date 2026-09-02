'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from './Sidebar'

// alle verlinkbaren Blätter aus der Navigation (Label + Icon) auflösen
const allLeaf = []
NAV.forEach((n) => {
  if (n.type === 'link') allLeaf.push({ href: n.href, label: n.label, icon: n.icon })
  else if (n.type === 'group') (n.items || []).forEach((it) => allLeaf.push({ href: it.href, label: it.label, icon: it.icon }))
})
const byHref = {}
allLeaf.forEach((x) => { byHref[x.href] = x })

export default function FavRail() {
  const path = usePathname()
  const [favs, setFavs] = useState([])
  const [freig, setFreig] = useState({ restricted: false, leaves: [] })

  useEffect(() => {
    const read = () => { try { const f = localStorage.getItem('sidebar_favs'); setFavs(f ? JSON.parse(f) : []) } catch (e) { setFavs([]) } }
    read()
    const onCustom = (e) => setFavs(Array.isArray(e.detail) ? e.detail : [])
    const onFreig = (e) => setFreig(e.detail && Array.isArray(e.detail.leaves) ? e.detail : { restricted: false, leaves: [] })
    window.addEventListener('wt-favs', onCustom)
    window.addEventListener('wt-freigaben', onFreig)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener('wt-favs', onCustom); window.removeEventListener('wt-freigaben', onFreig); window.removeEventListener('storage', read) }
  }, [])

  const favItems = favs.map((h) => byHref[h]).filter(Boolean)
  // Mitarbeiter-Rollen: freigegebene Bereiche automatisch als Übersicht ergänzen
  const items = freig.restricted
    ? [...favItems, ...freig.leaves.filter((l) => !favs.includes(l.href))]
    : favItems
  const isActive = (h) => path === h || path.startsWith(h + '/')

  return (
    <aside className="favrail">
      <div className="favrail-hd"><i className="ti ti-star" /> {freig.restricted ? 'Meine Bereiche' : 'Favoriten'}</div>
      {items.length ? items.map((it) => (
        <Link key={it.href} href={it.href} className={'favrail-item' + (isActive(it.href) ? ' active' : '')} title={it.label}>
          <i className={'ti ' + it.icon} />
          <span>{it.label}</span>
        </Link>
      )) : <div className="favrail-empty">Noch keine – mit ☆ markieren</div>}
    </aside>
  )
}
