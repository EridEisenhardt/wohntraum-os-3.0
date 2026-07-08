'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  { type: 'link', href: '/', icon: 'ti-layout-dashboard', label: 'Cockpit', exact: true },
  { type: 'link', href: '/gf-dashboard', icon: 'ti-chart-pie', label: 'GF-Dashboard' },
  { type: 'link', href: '/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
  { type: 'group', key: 'strategie', icon: 'ti-chess', label: 'Strategie', items: [
    { href: '/strategie/veraenderungen', icon: 'ti-arrows-shuffle', label: 'Veränderungen in der Organisation' },
  ] },
  { type: 'group', key: 'baustandard', icon: 'ti-ruler-2', label: 'Baustandard', items: [
    { href: '/planung/baustandard', icon: 'ti-ruler-2', label: 'Baustandard' },
    { href: '/planung/materialliste', icon: 'ti-list-details', label: 'Materialliste' },
  ] },
  { type: 'link', href: '/aktivitaeten', icon: 'ti-checklist', label: 'Aktivitäten' },
  { type: 'group', key: 'vermietung', icon: 'ti-home-search', label: 'Vermietung', items: [
    { href: '/vermietung/steckbrief', icon: 'ti-id-badge-2', label: 'Steckbrief Generator' },
    { href: '/vermietung/laufende-vermietungen', icon: 'ti-progress', label: 'Laufende Vermietungen' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Zahlungsvereinbarungsgenerator' },
  ] },
  { type: 'group', key: 'controlling', icon: 'ti-chart-histogram', label: 'Controlling', items: [
    { href: '/controlling/statistik', icon: 'ti-chart-bar', label: 'Statistik' },
    { href: '/controlling/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel' },
    { href: '/controlling/nahaus-fixkosten', icon: 'ti-file-invoice', label: 'Fixkosten Objekte' },
    { href: '/controlling/nahaus-rechnungen', icon: 'ti-receipt', label: 'Rechnungen Unternehmen' },
    { href: '/controlling/gruppe-fixkosten', icon: 'ti-building-bank', label: 'Fixkosten der Gruppe' },
  ] },
  { type: 'group', key: 'produktivitaet', icon: 'ti-rocket', label: 'Produktivität', items: [
    { href: '/produktivitaet/tracking', icon: 'ti-chart-line', label: 'Tracking' },
    { href: '/produktivitaet/planung', icon: 'ti-calendar-event', label: 'Wochenplanung' },
    { href: '/produktivitaet/ideale-woche', icon: 'ti-calendar-heart', label: 'Ideale Woche' },
    { href: '/produktivitaet/statusbericht', icon: 'ti-clipboard-check', label: 'Statusbericht GF' },
    { href: '/produktivitaet/stundengehalt', icon: 'ti-clock-dollar', label: 'Stundengehalt' },
  ] },
  { type: 'group', key: 'mastermind', icon: 'ti-bulb', label: 'Prozesse & Mastermind', items: [
    { href: '/prozesse-mastermind', icon: 'ti-users-group', label: 'Mastermind', exact: true },
    { href: '/prozesse-mastermind/rechenschaft', icon: 'ti-checkup-list', label: 'Rechenschaftsbericht' },
  ] },
  { type: 'group', key: 'finance', icon: 'ti-cash', label: 'Finance', items: [
    { href: '/finance/input', icon: 'ti-forms', label: 'Input' },
    { href: '/finance/darlehen', icon: 'ti-businessplan', label: 'Darlehen' },
    { href: '/finance/darlehensregister', icon: 'ti-list-numbers', label: 'Darlehensregister' },
    { href: '/finance/darlehensgenerator', icon: 'ti-calculator', label: 'Darlehensgenerator' },
    { href: '/finance/selbstauskunft', icon: 'ti-user-search', label: 'Selbstauskunft für die Bank' },
    { href: '/finance/reporting', icon: 'ti-report-analytics', label: 'Reporting für die Bank' },
    { href: '/finance/steuer-bilanz', icon: 'ti-receipt-tax', label: 'Steuer und Bilanzunterlagen' },
    { href: '/finance/liquiditaetsplanung', icon: 'ti-wallet', label: 'Liquiditätsplanung' },
  ] },
  { type: 'link', href: '/dokumente', icon: 'ti-files', label: 'Dokumente' },
  { type: 'group', key: 'stammdaten', icon: 'ti-database', label: 'Stammdaten', items: [
    { href: '/stammdaten/kontakte', icon: 'ti-users', label: 'Kontakte' },
    { href: '/stammdaten/firmen', icon: 'ti-building', label: 'Firmen' },
  ] },
  { type: 'group', key: 'personal', icon: 'ti-users-group', label: 'Personal', items: [
    { href: '/personal/akte', icon: 'ti-id', label: 'Personalakte' },
    { href: '/personal/urlaub', icon: 'ti-beach', label: 'Urlaub' },
    { href: '/personal/krankheit', icon: 'ti-vaccine', label: 'Krankheit' },
    { href: '/personal/arbeitsstunden', icon: 'ti-clock-hour-4', label: 'Arbeitsstunden' },
    { href: '/personal/lohnkosten', icon: 'ti-coin-euro', label: 'Lohnkosten' },
  ] },
  { type: 'group', key: 'eric-privat', icon: 'ti-user-heart', label: 'Eric Privat', items: [
    { href: '/eric-privat/budgetplan', icon: 'ti-wallet', label: 'Budgetplan' },
  ] },
  { type: 'link', href: '/nutzer', icon: 'ti-shield-lock', label: 'Nutzerverwaltung' },
]

export default function Sidebar({ user, demo, onLogout }) {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    try { const s = localStorage.getItem('sidebar_collapsed'); if (s) setCollapsed(JSON.parse(s)) } catch (e) {}
  }, [])

  const toggle = (key) => setCollapsed((prev) => {
    const next = { ...prev, [key]: !prev[key] }
    try { localStorage.setItem('sidebar_collapsed', JSON.stringify(next)) } catch (e) {}
    return next
  })

  const isActive = (item) => item.exact ? path === item.href : (path === item.href || path.startsWith(item.href + '/'))
  const cls = (active) => 'nav-item' + (active ? ' active' : '')
  const subCls = (active) => 'nav-sub' + (active ? ' active' : '')
  const email = user && user.email ? user.email : null
  const initials = email ? email.slice(0, 2).toUpperCase() : 'EE'

  return (
    <aside className="sidebar">
      <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }} title="Zum Cockpit">
        <div className="logo">W</div>
        <div>
          <div className="name">Wohntraum</div>
          <div className="sub">Rheinhessen OS</div>
        </div>
      </Link>

      {NAV.map((n) => {
        if (n.type === 'link') {
          return (
            <Link key={n.href} href={n.href} className={cls(isActive(n))}>
              <i className={'ti ' + n.icon} /> {n.label}
            </Link>
          )
        }
        const isOpen = !collapsed[n.key]
        const groupActive = n.items.some(isActive)
        return (
          <div key={n.key}>
            <div className="nav-group" onClick={() => toggle(n.key)} style={{ cursor: 'pointer', userSelect: 'none' }} title={isOpen ? 'Einklappen' : 'Ausklappen'}>
              <i className={'ti ' + n.icon + ' lead'} />
              <span style={{ fontWeight: groupActive && !isOpen ? 700 : undefined }}>{n.label}</span>
              <i className="ti ti-chevron-down chev" style={{ transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
            </div>
            {isOpen && n.items.map((it) => (
              <Link key={it.href} href={it.href} className={subCls(isActive(it))}>
                <i className={'ti ' + it.icon} /> {it.label}
              </Link>
            ))}
          </div>
        )
      })}

      <Link href="/" className="nav-item"><i className="ti ti-settings" /> Einstellungen</Link>

      <div className="me">
        <div className="av">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email || 'Demo-Modus'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--hint)' }}>{demo ? 'ohne Supabase' : 'angemeldet'}</div>
        </div>
        {!demo && (
          <button className="logoutbtn" title="Abmelden" onClick={onLogout}>
            <i className="ti ti-logout" />
          </button>
        )}
      </div>
    </aside>
  )
}
