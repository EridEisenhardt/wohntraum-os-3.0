'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export const NAV = [
  { type: 'link', href: '/', icon: 'ti-layout-dashboard', label: 'Cockpit', exact: true, area: 'common' },
  { type: 'link', href: '/tools', icon: 'ti-layout-grid', label: 'Alle Tools', area: 'common' },
  { type: 'group', key: 'gf-dashboard', icon: 'ti-chart-pie', label: 'GF-Dashboard', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/gf-dashboard', icon: 'ti-chart-pie', label: 'Übersicht' },
    { href: '/gf-dashboard/kpi', icon: 'ti-gauge', label: 'KPI GF Kennzahlen' },
  ] },
  { type: 'link', href: '/beschluesse', icon: 'ti-clipboard-check', label: 'Beschlüsse', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'group', key: 'buchhaltung', icon: 'ti-calculator', label: 'Buchhaltung', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/wiederkehrende-zahlungen', icon: 'ti-repeat', label: 'Wiederkehrende Zahlungen' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Zahlungsvereinbarungsgenerator' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Zahlungsvereinbarungen (Register)' },
    { href: '/controlling/nahaus-rechnungen', icon: 'ti-receipt', label: 'Rechnungen Unternehmen' },
    { href: '/mahnprozess/generator', icon: 'ti-file-invoice', label: 'Mahnungen & Register' },
    { href: '/mahnprozess', icon: 'ti-gavel', label: 'Mahnprozess' },
  ] },
  { type: 'group', key: 'hausverwaltung', icon: 'ti-home-cog', label: 'Hausverwaltung', area: ['hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/hausverwaltung/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/portfolio', icon: 'ti-chart-dots-3', label: 'Portfolio (Faktor · Cashflow)' },
    { href: '/hausverwaltung/mietermeldungen', icon: 'ti-message-report', label: 'Mietermeldungen' },
    { href: '/hausverwaltung/dienstleister', icon: 'ti-address-book', label: 'Firmen & Dienstleister' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Ratenzahlungsgenerator' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Zahlungsvereinbarungen (Register)' },
  ] },
  { type: 'link', href: '/hausmeisterdienst', icon: 'ti-tools', label: 'Übersicht', area: ['hv', 'backoffice'], mod: 'dashboards' },
  { type: 'group', key: 'assetmgmt-bh', icon: 'ti-building-bank', label: 'Assetmanagement', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/assetmanagement', icon: 'ti-chart-arcs', label: 'Übersicht' },
    { href: '/buchhaltung/assetmanagement/input-portfolio', icon: 'ti-database-import', label: 'Input Portfolio' },
    { href: '/buchhaltung/assetmanagement/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/buchhaltung/assetmanagement/entwicklungen', icon: 'ti-trending-up', label: 'Entwicklungen' },
    { href: '/buchhaltung/assetmanagement/zielentwicklung', icon: 'ti-target-arrow', label: 'Zielentwicklung in €' },
    { href: '/buchhaltung/assetmanagement/liquiditaet', icon: 'ti-cash', label: 'Liquidität' },
    { href: '/buchhaltung/assetmanagement/anverkauf', icon: 'ti-transfer', label: 'An- und Verkauf von Immobilien' },
  ] },
  { type: 'group', key: 'assetmanagement', icon: 'ti-building-estate', label: 'Assetmanagement (Optimierung)', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/assetmanagement/einnahmenoptimierung', icon: 'ti-trending-up', label: 'Einnahmenoptimierung' },
    { href: '/assetmanagement/steueroptimierung', icon: 'ti-receipt-tax', label: 'Steueroptimierung' },
    { href: '/assetmanagement/mietoptimierung', icon: 'ti-home-dollar', label: 'Mietoptimierung' },
  ] },
  { type: 'group', key: 'strategie', icon: 'ti-chess', label: 'Strategie', area: 'vertrieb', mod: 'dashboards', items: [
    { href: '/strategie/veraenderungen', icon: 'ti-arrows-shuffle', label: 'Veränderungen in der Organisation' },
  ] },
  { type: 'group', key: 'baustandard', icon: 'ti-ruler-2', label: 'Baustandard', area: 'vertrieb', mod: 'dashboards', items: [
    { href: '/planung/baustandard', icon: 'ti-ruler-2', label: 'Baustandard' },
    { href: '/planung/materialliste', icon: 'ti-list-details', label: 'Materialliste' },
    { href: '/planung/kpi-sanierungen', icon: 'ti-chart-dots', label: 'KPI Sanierungen' },
    { href: '/planung/renovierungsliste', icon: 'ti-file-report', label: 'Renovierungs- und Sanierungsliste' },
  ] },
  { type: 'group', key: 'crm', icon: 'ti-address-book', label: 'CRM', area: ['vertrieb', 'hv'], mod: 'crm', items: [
    { href: '/crm', icon: 'ti-users', label: 'Kontakte & Deals' },
    { href: '/tickets', icon: 'ti-ticket', label: 'Ticketsystem' },
  ] },
  { type: 'link', href: '/aktivitaeten', icon: 'ti-checklist', label: 'Aktivitäten', area: 'hv', mod: 'aktivitaeten' },
  { type: 'group', key: 'ankauf', icon: 'ti-key', label: 'Ankauf', area: 'vertrieb', mod: 'ankauf', items: [
    { href: '/ankauf/akquise', icon: 'ti-map-search', label: 'Immobilien Akquise' },
  ] },
  { type: 'group', key: 'vermietung', icon: 'ti-home-search', label: 'Vermietung', area: 'vertrieb', mod: 'vermietung', items: [
    { href: '/vermietung/mietinteressenten', icon: 'ti-users-plus', label: 'Mietinteressenten' },
    { href: '/vermietung/wohnungsvermietung', icon: 'ti-home-cog', label: 'Wohnungsvermietung' },
    { href: '/vermietung/wohnungsvermietung-bpmn', icon: 'ti-hierarchy-2', label: 'Wohnungsvermietung · BPMN' },
    { href: '/vermietung/steckbrief', icon: 'ti-id-badge-2', label: 'Steckbrief Generator' },
    { href: '/vermietung/laufende-vermietungen', icon: 'ti-progress', label: 'Laufende Vermietungen' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Zahlungsvereinbarungsgenerator' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Zahlungsvereinbarungen (Register)' },
  ] },
  { type: 'group', key: 'controlling', icon: 'ti-chart-histogram', label: 'Controlling', area: 'hv', mod: 'controlling', items: [
    { href: '/controlling/statistik', icon: 'ti-chart-bar', label: 'Statistik' },
    { href: '/controlling/xray', icon: 'ti-scan', label: 'xRay' },
    { href: '/controlling/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel (Controlling)' },
    { href: '/controlling/nahaus-rechnungen', icon: 'ti-receipt', label: 'Rechnungen Unternehmen' },
  ] },
  { type: 'group', key: 'produktivitaet', icon: 'ti-rocket', label: 'Produktivität', area: 'hv', mod: 'produktivitaet', items: [
    { href: '/produktivitaet/tracking', icon: 'ti-chart-line', label: 'Tracking' },
    { href: '/produktivitaet/planung', icon: 'ti-calendar-event', label: 'Wochenplanung' },
    { href: '/produktivitaet/ideale-woche', icon: 'ti-calendar-heart', label: 'Ideale Woche' },
    { href: '/produktivitaet/statusbericht', icon: 'ti-clipboard-check', label: 'Statusbericht GF' },
    { href: '/produktivitaet/dokumentnamen', icon: 'ti-file-text', label: 'Dokumentennamen-Generator' },
    { href: '/produktivitaet/stundengehalt', icon: 'ti-clock-dollar', label: 'Stundengehalt' },
    { href: '/produktivitaet/gpm-tracker', icon: 'ti-target-arrow', label: 'GPM-Tracker' },
  ] },
  { type: 'group', key: 'finance', icon: 'ti-cash', label: 'Finance', area: 'hv', mod: 'finance', items: [
    { href: '/finance/input', icon: 'ti-forms', label: 'Input' },
    { href: '/finance/darlehen', icon: 'ti-businessplan', label: 'Darlehen' },
    { href: '/finance/darlehensregister', icon: 'ti-list-numbers', label: 'Darlehensregister' },
    { href: '/finance/darlehensgenerator', icon: 'ti-calculator', label: 'Darlehensgenerator' },
    { href: '/finance/zinsberechnung', icon: 'ti-percentage', label: 'Zinsberechnung' },
    { href: '/finance/selbstauskunft', icon: 'ti-user-search', label: 'Selbstauskunft für die Bank' },
    { href: '/finance/reporting', icon: 'ti-report-analytics', label: 'Reporting für die Bank' },
    { href: '/finance/steuer-bilanz', icon: 'ti-receipt-tax', label: 'Steuer und Bilanzunterlagen' },
    { href: '/finance/liquiditaetsplanung', icon: 'ti-wallet', label: 'Liquiditätsplanung' },
    { href: '/finance/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel (Finance)' },
  ] },
  { type: 'group', key: 'prozesse', icon: 'ti-sitemap', label: 'Prozesse', area: ['vertrieb', 'hv'], mod: 'produktivitaet', items: [
    { href: '/prozesse/bpmn', icon: 'ti-hierarchy-2', label: 'BPMN-Modellierung' },
  ] },
  { type: 'link', href: '/dokumente', icon: 'ti-files', label: 'Dokumente', area: 'common', mod: 'dokumente' },
  { type: 'group', key: 'stammdaten', icon: 'ti-database', label: 'Stammdaten', area: 'hv', mod: 'dokumente', items: [
    { href: '/stammdaten/kontakte', icon: 'ti-users', label: 'Kontakte' },
    { href: '/stammdaten/firmen', icon: 'ti-building', label: 'Firmen' },
  ] },
  { type: 'group', key: 'personal', icon: 'ti-users-group', label: 'Personal', area: ['hv', 'backoffice'], mod: 'personal', items: [
    { href: '/personal/zustaendigkeiten', icon: 'ti-list-check', label: 'Zuständigkeiten & SOPs' },
    { href: '/personal/akte', icon: 'ti-id', label: 'Personalakte' },
    { href: '/personal/urlaub', icon: 'ti-beach', label: 'Urlaub' },
    { href: '/personal/krankheit', icon: 'ti-vaccine', label: 'Krankheit' },
    { href: '/personal/arbeitsstunden', icon: 'ti-clock-hour-4', label: 'Arbeitsstunden' },
    { href: '/personal/lohnkosten', icon: 'ti-coin-euro', label: 'Lohnkosten' },
  ] },
  { type: 'group', key: 'eric-privat', icon: 'ti-user-heart', label: 'Eric Privat', area: ['vertrieb', 'hv'], mod: 'privat', items: [
    { href: '/eric-privat/budgetplan', icon: 'ti-wallet', label: 'Budgetplan' },
    { href: '/eric-privat/idealer-tag', icon: 'ti-sun', label: 'Idealer Tag' },
    { href: '/eric-privat/entwicklung', icon: 'ti-stairs-up', label: 'Entwicklung' },
    { href: '/eric-privat/engpassanalyse', icon: 'ti-filter-cog', label: 'Engpassanalyse' },
    { href: '/eric-privat/vermoegensbilanz', icon: 'ti-scale', label: 'Vermögensbilanz' },
    { href: '/eric-privat/weiterbildung', icon: 'ti-school', label: 'Aus- und Fortbildung' },
    { href: '/eric-privat/liegestuetz', icon: 'ti-barbell', label: 'Liegestütz' },
    { href: '/eric-privat/essen-planer', icon: 'ti-tools-kitchen-2', label: 'Essen-Planer' },
    { href: '/eric-privat/kontenmodell', icon: 'ti-wallet', label: '6 Kontenmodell' },
  ] },
  { type: 'link', href: '/jahresplaner', icon: 'ti-calendar', label: 'Jahresplaner', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/persoenliche-assistenz', icon: 'ti-user-heart', label: 'Persönliche Assistenz', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/haushaltshilfe', icon: 'ti-home-heart', label: 'Haushaltshilfe', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/konto', icon: 'ti-user-cog', label: 'Mein Konto', area: 'common' },
  { type: 'link', href: '/nutzer', icon: 'ti-shield-lock', label: 'Nutzerverwaltung', area: 'common', mod: 'nutzer' },
]

// Rechte-Knoten aus der Navigation: jede Kategorie (Gruppe) + jede Unterkategorie (Eintrag) einzeln.
const NODE_ADMIN_ONLY = (mod) => mod === 'nutzer' || mod === 'mahnprozess' || mod === 'privat'
export function permNodes() {
  const nodes = []
  NAV.forEach((n) => {
    if (n.type === 'group') {
      const adminOnly = n.key === 'eric-privat'
      nodes.push({ key: 'cat:' + n.key, label: n.label, level: 0, adminOnly })
      ;(n.items || []).forEach((it) => nodes.push({ key: 'sub:' + it.href, label: it.label, level: 1, adminOnly, parent: 'cat:' + n.key }))
    } else if (n.type === 'link' && n.mod) {
      nodes.push({ key: 'lnk:' + n.href, label: n.label, level: 0, adminOnly: NODE_ADMIN_ONLY(n.mod) })
    }
  })
  return nodes
}

// Zuordnung jeder Kategorie/Verknüpfung zu einem Geschäftsbereich
export const GESCHAEFTE = [
  { v: 'fav', label: 'Favoriten', icon: 'ti-star' },
  { v: 'desktop', label: 'Desktop', icon: 'ti-home', href: '/' },
  { v: 'vertrieb', label: 'Vertrieb', icon: 'ti-chart-line' },
  { v: 'buchhaltung', label: 'Buchhaltung', icon: 'ti-calculator' },
  { v: 'hausverwaltung', label: 'Hausverwaltung', icon: 'ti-home' },
  { v: 'hausmeisterdienst', label: 'Hausmeisterdienst', icon: 'ti-tools' },
  { v: 'gf', label: 'Geschäftsführer', icon: 'ti-user' },
]
export const GB_MAP = {
  ankauf: 'vertrieb', vermietung: 'vertrieb', crm: 'vertrieb', baustandard: 'vertrieb', assetmanagement: 'vertrieb', strategie: 'vertrieb',
  buchhaltung: 'buchhaltung', controlling: 'buchhaltung', finance: 'buchhaltung', 'assetmgmt-bh': 'vertrieb', stammdaten: 'buchhaltung',
  hausverwaltung: 'hausverwaltung', prozesse: 'hausverwaltung',
  produktivitaet: 'gf', personal: 'gf', 'eric-privat': 'gf',
  'gf-dashboard': 'gf', '/gf-dashboard': 'gf', '/beschluesse': 'gf', '/aktivitaeten': 'hausverwaltung', '/dokumente': 'buchhaltung', '/nutzer': 'gf',
  '/hausmeisterdienst': 'hausmeisterdienst', '/haushaltshilfe': 'gf', '/jahresplaner': 'gf', '/persoenliche-assistenz': 'gf',
}
export const gbOf = (n) => (n.type === 'group' ? GB_MAP[n.key] : GB_MAP[n.href])

export default function Sidebar({ user, demo, onLogout, role, perms }) {
  const path = usePathname()
  const [selectedGb, setSelectedGb] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [q, setQ] = useState('')
  const [favs, setFavs] = useState([])
  const [dragFav, setDragFav] = useState(null)
  const isAdmin = role === 'admin'

  const has = (key) => !!(perms && Object.prototype.hasOwnProperty.call(perms, key))
  const on = (key) => { const p = perms && perms[key]; return !!(p && p.sehen) }
  const canSeeItem = (n, it) => {
    if (demo || isAdmin) return true
    if (n.key === 'eric-privat') return isAdmin
    if (!perms) return true
    const key = 'sub:' + it.href
    return has(key) ? on(key) : on(n.mod)
  }
  const canSee = (n) => {
    if (n.type === 'group') {
      if (demo || isAdmin) return true
      if (n.key === 'eric-privat') return isAdmin
      if (!perms) return true
      const catKey = 'cat:' + n.key
      const base = has(catKey) ? on(catKey) : on(n.mod)
      return base || (n.items || []).some((it) => canSeeItem(n, it))
    }
    if (!n.mod) return true
    if (demo || isAdmin) return true
    if (NODE_ADMIN_ONLY(n.mod)) return isAdmin
    if (!perms) return true
    const lnkKey = 'lnk:' + n.href
    return has(lnkKey) ? on(lnkKey) : on(n.mod)
  }

  useEffect(() => {
    try { const g = localStorage.getItem('sidebar_gb'); if (g) setSelectedGb(g) } catch (e) {}
    try { const f = localStorage.getItem('sidebar_favs'); if (f) setFavs(JSON.parse(f)) } catch (e) {}
  }, [])
  useEffect(() => { setSelectedCat(null); setQ('') }, [path])
  // Favoriten-Änderungen an die linke Favoritenleiste (FavRail) melden
  useEffect(() => { try { window.dispatchEvent(new CustomEvent('wt-favs', { detail: favs })) } catch (e) {} }, [favs])

  const isFav = (href) => favs.includes(href)
  const toggleFav = (href, e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setFavs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
      try { localStorage.setItem('sidebar_favs', JSON.stringify(next)) } catch (er) {}
      return next
    })
  }

  // Favoriten umsortieren: 'dragged' vor 'target' einfügen (target=null → ans Ende)
  const moveFavBefore = (dragged, target) => {
    if (!dragged || dragged === target) return
    setFavs((prev) => {
      const arr = prev.filter((h) => h !== dragged)
      const to = target == null ? -1 : arr.indexOf(target)
      if (to < 0) arr.push(dragged); else arr.splice(to, 0, dragged)
      try { localStorage.setItem('sidebar_favs', JSON.stringify(arr)) } catch (er) {}
      return arr
    })
  }

  const isActive = (item) => item.exact ? path === item.href : (path === item.href || path.startsWith(item.href + '/'))
  const chooseGb = (g) => {
    setSelectedGb((prev) => {
      const next = prev === g ? null : g
      try { localStorage.setItem('sidebar_gb', next || '') } catch (e) {}
      return next
    })
    setSelectedCat(null)
  }
  const selectGb = (g) => {
    setSelectedGb(g)
    try { localStorage.setItem('sidebar_gb', g || '') } catch (e) {}
    setSelectedCat(null)
  }
  const toggleCat = (key) => setSelectedCat((prev) => (prev === key ? null : key))

  const email = user && user.email ? user.email : null
  const initials = email ? email.slice(0, 2).toUpperCase() : 'EE'

  const flatSearch = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) flatSearch.push({ href: n.href, label: n.label, icon: n.icon, group: '' }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) flatSearch.push({ href: it.href, label: it.label, icon: it.icon, group: n.label }) }) }
  })
  const ql = q.trim().toLowerCase()
  const results = ql ? flatSearch.filter((x) => (x.label + ' ' + x.group).toLowerCase().includes(ql)) : []

  // Aktive Ableitung aus dem aktuellen Pfad
  const activeGroupPath = NAV.find((n) => n.type === 'group' && canSee(n) && n.items.some(isActive))
  const activeLinkPath = NAV.find((n) => n.type === 'link' && isActive(n))
  const bereichGb = path && path.startsWith('/bereich/') ? path.split('/')[2] : null
  const derivedGb = bereichGb || (activeGroupPath ? gbOf(activeGroupPath) : (activeLinkPath ? gbOf(activeLinkPath) : null))
  const activeGb = selectedGb || derivedGb || null

  const catItems = NAV.filter((n) => canSee(n) && gbOf(n) === activeGb)
  const activeCat = selectedCat
    ? catItems.find((n) => n.type === 'group' && n.key === selectedCat)
    : (activeGroupPath && gbOf(activeGroupPath) === activeGb ? activeGroupPath : null)
  const subItems = activeCat && activeCat.type === 'group' ? activeCat.items.filter((it) => canSeeItem(activeCat, it)) : []

  // Favoriten
  const allLeaf = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) allLeaf.push({ href: n.href, label: n.label, icon: n.icon }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) allLeaf.push({ href: it.href, label: it.label, icon: it.icon }) }) }
  })
  const favItems = favs.map((h) => allLeaf.find((x) => x.href === h)).filter(Boolean)

  return (
    <header className="appnav">
      <div className="topbar-top">
        <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', padding: 0, gap: 10 }} title="Zum Cockpit">
          <div className="logo">W</div>
          <div><div className="name">Wohntraum</div><div className="sub">Rheinhessen OS</div></div>
        </Link>
        <div className="tb-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Thema suchen…" />
          {ql && (
            <>
              <div className="tb-backdrop" onClick={() => setQ('')} />
              <div className="sresults">
                {results.length ? results.map((x) => (
                  <Link key={x.href} href={x.href} className={isActive(x) ? 'active' : ''} onClick={() => setQ('')}>
                    <i className={'ti ' + x.icon} /> {x.label}{x.group && <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--hint)' }}>{x.group}</span>}
                  </Link>
                )) : <div style={{ padding: '10px 12px', color: 'var(--hint)', fontStyle: 'italic', fontSize: 13 }}>Kein Treffer für „{q}"</div>}
              </div>
            </>
          )}
        </div>
        <div className="tb-me">
          <Link href="/tools" className="nav-mini" title="Alle Tools"><i className="ti ti-layout-grid" /></Link>
          <Link href="/konto" className="nav-mini" title="Mein Konto"><i className="ti ti-user-cog" /></Link>
          <div className="av" title={email || 'Demo-Modus'}>{initials}</div>
          {!demo && <button className="logoutbtn" title="Abmelden" onClick={onLogout} style={{ marginLeft: 0 }}><i className="ti ti-logout" /></button>}
        </div>
      </div>

      {/* Zeile 1: Geschäftsbereich */}
      <nav className="gbbar">
        {GESCHAEFTE.map((g) => {
          if (g.href) return (
            <Link key={g.v} href={g.href} className={'gb' + (path === g.href ? ' active' : '')}>
              <i className={'ti ' + g.icon} /> {g.label}
            </Link>
          )
          if (g.v === 'fav') return (
            <button key={g.v} className={'gb' + (activeGb === g.v ? ' active' : '')} onClick={() => chooseGb(g.v)}>
              <i className={'ti ' + g.icon} /> {g.label}
            </button>
          )
          const bereichPath = '/bereich/' + g.v
          return (
            <Link key={g.v} href={bereichPath} className={'gb' + (activeGb === g.v ? ' active' : '')} onClick={() => selectGb(g.v)}>
              <i className={'ti ' + g.icon} /> {g.label}
            </Link>
          )
        })}
      </nav>

      {/* Zeile 2: Favoriten (per Drag & Drop umsortierbar) */}
      {activeGb === 'fav' && (
        <nav className="catbar">
          {favItems.length ? (
            <>
              {favItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={'cat' + (isActive(it) ? ' active' : '')}
                  draggable
                  onDragStart={(e) => { setDragFav(it.href); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => setDragFav(null)}
                  onDragOver={(e) => { if (dragFav && dragFav !== it.href) e.preventDefault() }}
                  onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, it.href); setDragFav(null) }}
                  title="Ziehen zum Umsortieren"
                  style={{ cursor: 'grab', opacity: dragFav === it.href ? 0.4 : 1 }}
                >
                  <i className="ti ti-grip-vertical" style={{ opacity: 0.45, fontSize: 13, marginRight: 1 }} /> <i className={'ti ' + it.icon} /> {it.label}
                </Link>
              ))}
              {dragFav && (
                <span
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, null); setDragFav(null) }}
                  title="Ans Ende verschieben"
                  style={{ minWidth: 40, alignSelf: 'stretch', borderRadius: 8, border: '1px dashed var(--muted)', opacity: 0.55, margin: '4px 0' }}
                />
              )}
            </>
          ) : <span style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 12.5 }}>Noch keine Favoriten – Stern ☆ in der Unterkategorie antippen.</span>}
        </nav>
      )}

      {/* Zeile 2: Kategorie */}
      {activeGb && activeGb !== 'fav' && catItems.length > 0 && (
        <nav className="catbar">
          {catItems.map((n) => {
            if (n.type === 'link') return (
              <Link key={n.href} href={n.href} className={'cat' + (isActive(n) ? ' active' : '')}>
                <i className={'ti ' + n.icon} /> {n.label}
              </Link>
            )
            const catActive = activeCat && activeCat.key === n.key
            return (
              <button key={n.key} className={'cat' + (catActive ? ' active' : '')} onClick={() => toggleCat(n.key)}>
                <i className={'ti ' + n.icon} /> {n.label}
              </button>
            )
          })}
        </nav>
      )}

      {/* Zeile 3: Unterkategorie */}
      {subItems.length > 0 && (
        <nav className="subpanel">
          {subItems.map((it) => (
            <span key={it.href} className="subwrap">
              <Link href={it.href} className={isActive(it) ? 'active' : ''}>
                <i className={'ti ' + it.icon} /> {it.label}
              </Link>
              <span className="favstar2" onClick={(e) => toggleFav(it.href, e)} title={isFav(it.href) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'} style={{ color: isFav(it.href) ? '#f5c518' : 'rgba(255,255,255,.55)' }}>{isFav(it.href) ? '★' : '☆'}</span>
            </span>
          ))}
        </nav>
      )}
    </header>
  )
}
