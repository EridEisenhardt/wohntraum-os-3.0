'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export const NAV = [
  { type: 'link', href: '/', icon: 'ti-layout-dashboard', label: 'Cockpit', exact: true, area: 'common' },
  { type: 'link', href: '/tools', icon: 'ti-layout-grid', label: 'Alle Tools', area: 'common' },
  { type: 'link', href: '/gf-dashboard', icon: 'ti-chart-pie', label: 'GF-Dashboard', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'link', href: '/beschluesse', icon: 'ti-clipboard-check', label: 'Beschlüsse', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'link', href: '/portfolio', icon: 'ti-building-community', label: 'Portfolio', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'group', key: 'buchhaltung', icon: 'ti-calculator', label: 'Buchhaltung', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/wiederkehrende-zahlungen', icon: 'ti-repeat', label: 'Wiederkehrende Zahlungen' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Zahlungsvereinbarungsgenerator' },
    { href: '/controlling/nahaus-rechnungen', icon: 'ti-receipt', label: 'Rechnungen Unternehmen' },
    { href: '/mahnprozess/generator', icon: 'ti-file-invoice', label: 'Mahnungen & Register' },
    { href: '/mahnprozess', icon: 'ti-gavel', label: 'Mahnprozess' },
  ] },
  { type: 'group', key: 'hausverwaltung', icon: 'ti-home-cog', label: 'Hausverwaltung', area: ['hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/hausverwaltung/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/hausverwaltung/mietermeldungen', icon: 'ti-message-report', label: 'Mietermeldungen' },
    { href: '/hausverwaltung/dienstleister', icon: 'ti-address-book', label: 'Firmen & Dienstleister' },
  ] },
  { type: 'group', key: 'assetmgmt-bh', icon: 'ti-building-bank', label: 'Assetmanagement', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/assetmanagement', icon: 'ti-chart-arcs', label: 'Übersicht' },
    { href: '/buchhaltung/assetmanagement/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/buchhaltung/assetmanagement/entwicklungen', icon: 'ti-trending-up', label: 'Entwicklungen' },
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
  ] },
  { type: 'group', key: 'controlling', icon: 'ti-chart-histogram', label: 'Controlling', area: 'hv', mod: 'controlling', items: [
    { href: '/controlling/statistik', icon: 'ti-chart-bar', label: 'Statistik' },
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
    { href: '/eric-privat/liegestuetz', icon: 'ti-barbell', label: 'Liegestütz' },
    { href: '/eric-privat/essen-planer', icon: 'ti-tools-kitchen-2', label: 'Essen-Planer' },
    { href: '/eric-privat/kontenmodell', icon: 'ti-wallet', label: '6 Kontenmodell' },
  ] },
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
const GESCHAEFTE = [
  { v: 'vertrieb', label: 'Vertrieb', icon: 'ti-chart-line' },
  { v: 'buchhaltung', label: 'Buchhaltung', icon: 'ti-calculator' },
  { v: 'hausverwaltung', label: 'Hausverwaltung', icon: 'ti-home' },
  { v: 'gf', label: 'Geschäftsführer', icon: 'ti-user' },
]
const GB_MAP = {
  ankauf: 'vertrieb', vermietung: 'vertrieb', crm: 'vertrieb', baustandard: 'vertrieb', assetmanagement: 'vertrieb', strategie: 'vertrieb',
  buchhaltung: 'buchhaltung', controlling: 'buchhaltung', finance: 'buchhaltung', 'assetmgmt-bh': 'buchhaltung', stammdaten: 'buchhaltung',
  hausverwaltung: 'hausverwaltung', prozesse: 'hausverwaltung',
  produktivitaet: 'gf', personal: 'gf', 'eric-privat': 'gf',
  '/portfolio': 'vertrieb', '/gf-dashboard': 'gf', '/beschluesse': 'gf', '/aktivitaeten': 'hausverwaltung', '/dokumente': 'buchhaltung', '/nutzer': 'gf',
}
const gbOf = (n) => (n.type === 'group' ? GB_MAP[n.key] : GB_MAP[n.href])

export default function Sidebar({ user, demo, onLogout, role, perms }) {
  const path = usePathname()
  const [selectedGb, setSelectedGb] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)
  const [q, setQ] = useState('')
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
  }, [])
  useEffect(() => { setSelectedCat(null); setQ('') }, [path])

  const isActive = (item) => item.exact ? path === item.href : (path === item.href || path.startsWith(item.href + '/'))
  const chooseGb = (g) => {
    setSelectedGb((prev) => {
      const next = prev === g ? null : g
      try { localStorage.setItem('sidebar_gb', next || '') } catch (e) {}
      return next
    })
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
  const derivedGb = activeGroupPath ? gbOf(activeGroupPath) : (activeLinkPath ? gbOf(activeLinkPath) : null)
  const activeGb = selectedGb || derivedGb || null

  const catItems = NAV.filter((n) => canSee(n) && gbOf(n) === activeGb)
  const activeCat = selectedCat
    ? catItems.find((n) => n.type === 'group' && n.key === selectedCat)
    : (activeGroupPath && gbOf(activeGroupPath) === activeGb ? activeGroupPath : null)
  const subItems = activeCat && activeCat.type === 'group' ? activeCat.items.filter((it) => canSeeItem(activeCat, it)) : []

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
        {GESCHAEFTE.map((g) => (
          <button key={g.v} className={'gb' + (activeGb === g.v ? ' active' : '')} onClick={() => chooseGb(g.v)}>
            <i className={'ti ' + g.icon} /> {g.label}
          </button>
        ))}
      </nav>

      {/* Zeile 2: Kategorie */}
      {activeGb && catItems.length > 0 && (
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
            <Link key={it.href} href={it.href} className={isActive(it) ? 'active' : ''}>
              <i className={'ti ' + it.icon} /> {it.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
