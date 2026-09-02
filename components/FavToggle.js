'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NAV } from './Sidebar'

// alle verlinkbaren Blätter aus der Navigation auflösen
const allLeaf = []
NAV.forEach((n) => {
  if (n.type === 'link') allLeaf.push({ href: n.href, label: n.label })
  else if (n.type === 'group') (n.items || []).forEach((it) => allLeaf.push({ href: it.href, label: it.label }))
})

// aktuellen Pfad auf den passenden Navigations-Eintrag abbilden
function matchLeaf(path) {
  if (!path) return null
  const exact = allLeaf.find((x) => x.href === path)
  if (exact) return exact
  const cands = allLeaf
    .filter((x) => path === x.href || path.startsWith(x.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)
  return cands[0] || null
}

export default function FavToggle() {
  const path = usePathname()
  const [favs, setFavs] = useState([])

  useEffect(() => {
    const read = () => { try { const f = localStorage.getItem('sidebar_favs'); setFavs(f ? JSON.parse(f) : []) } catch (e) { setFavs([]) } }
    read()
    const onCustom = (e) => setFavs(Array.isArray(e.detail) ? e.detail : [])
    window.addEventListener('wt-favs', onCustom)
    window.addEventListener('storage', read)
    return () => { window.removeEventListener('wt-favs', onCustom); window.removeEventListener('storage', read) }
  }, [])

  const leaf = matchLeaf(path)
  if (!leaf) return null
  const href = leaf.href
  const isFav = favs.includes(href)

  const toggle = () => {
    setFavs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
      try { localStorage.setItem('sidebar_favs', JSON.stringify(next)) } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('wt-favs', { detail: next })) } catch (e) {}
      return next
    })
  }

  return (
    <button className={'favtoggle' + (isFav ? ' on' : '')} onClick={toggle}
      title={isFav ? 'Aus Favoriten entfernen' : 'Diese Seite als Favorit speichern'}>
      <span className="favtoggle-star">{isFav ? '★' : '☆'}</span>
      <span className="favtoggle-lbl">{isFav ? 'Favorit' : 'Als Favorit'}</span>
    </button>
  )
}
