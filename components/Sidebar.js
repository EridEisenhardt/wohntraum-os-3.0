'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export const NAV = [
  { type: 'link', href: '/', icon: 'ti-layout-dashboard', label: 'Cockpit', exact: true, area: 'common' },
  { type: 'link', href: '/tools', icon: 'ti-layout-grid', label: 'Alle Tools', area: 'common' },
  { type: 'group', key: 'gf-dashboard', icon: 'ti-chart-pie', label: 'GF-Dashboard', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/gf-dashboard', icon: 'ti-chart-pie', label: 'Übersicht' },
    { href: '/gf-dashboard/kpi', icon: 'ti-gauge', label: 'KPI GF · Cashflow je Struktur' },
  ] },
  { type: 'link', href: '/beschluesse', icon: 'ti-clipboard-check', label: 'Beschlüsse', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'group', key: 'backoffice', icon: 'ti-building-warehouse', label: 'Backoffice-Kosten', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/backoffice-kosten', icon: 'ti-cash-banknote', label: 'Backoffice-Kosten & Umlage je Wohneinheit' },
  ] },
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
    { href: '/gerichtsfaelle', icon: 'ti-gavel', label: 'Gericht-Anwalt-Inkasso' },
  ] },
  { type: 'link', href: '/hausmeisterdienst', icon: 'ti-tools', label: 'Übersicht', area: ['hv', 'backoffice'], mod: 'dashboards' },
  { type: 'group', key: 'assetmgmt-bh', icon: 'ti-building-bank', label: 'Assetmanagement', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/assetmanagement', icon: 'ti-chart-arcs', label: 'Übersicht' },
    { href: '/buchhaltung/assetmanagement/input-portfolio', icon: 'ti-database-import', label: 'Input Portfolio' },
    { href: '/buchhaltung/assetmanagement/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/buchhaltung/assetmanagement/entwicklungen', icon: 'ti-trending-up', label: 'Entwicklungen' },
    { href: '/buchhaltung/assetmanagement/zielentwicklung', icon: 'ti-target-arrow', label: 'Zielentwicklung in €' },
    { href: '/buchhaltung/assetmanagement/liquiditaet', icon: 'ti-cash', label: 'Liquidität' },
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
    { href: '/ankauf/verkauf', icon: 'ti-cash-banknote', label: 'Immobilien Verkauf (Pipeline)' },
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
    { href: '/produktivitaet/not-to-do', icon: 'ti-ban', label: 'Not-To-Do & Delegieren' },
  ] },
  { type: 'group', key: 'finance', icon: 'ti-cash', label: 'Finance', area: 'hv', mod: 'finance', items: [
    { href: '/finance/input', icon: 'ti-forms', label: 'Input' },
    { href: '/finance/darlehen', icon: 'ti-businessplan', label: 'Darlehen' },
    { href: '/finance/darlehensregister', icon: 'ti-list-numbers', label: 'Darlehensregister' },
    { href: '/finance/darlehensgenerator', icon: 'ti-calculator', label: 'Darlehensgenerator' },
    { href: '/finance/zinsberechnung', icon: 'ti-percentage', label: 'Zinsberechnung' },
    { href: '/finance/selbstauskunft', icon: 'ti-user-search', label: 'Selbstauskunft für die Bank' },
    { href: '/finance/reporting', icon: 'ti-report-analytics', label: 'Reporting für die Bank' },
    { href: '/portfolio', icon: 'ti-chart-dots-3', label: 'Portfolio-Report (Faktor · Cashflow)' },
    { href: '/finance/steuer-bilanz', icon: 'ti-receipt-tax', label: 'Steuer und Bilanzunterlagen' },
    { href: '/finance/liquiditaetsplanung', icon: 'ti-wallet', label: 'Liquiditätsplanung' },
    { href: '/finance/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel (Finance)' },
  ] },
  { type: 'group', key: 'prozesse', icon: 'ti-sitemap', label: 'Prozesse', area: ['vertrieb', 'hv'], mod: 'produktivitaet', items: [
    { href: '/prozesse/bpmn', icon: 'ti-hierarchy-2', label: 'BPMN-Modellierung' },
  ] },
  { type: 'link', href: '/dokumente', icon: 'ti-files', label: 'Dokumente', area: 'common', mod: 'dokumente' },
  { type: 'link', href: '/dms', icon: 'ti-folders', label: 'DMS · Dokumentenverwaltung', area: 'common', mod: 'dokumente' },
  { type: 'group', key: 'wissensdatenbank', icon: 'ti-book', label: 'Wissensdatenbank', area: ['vertrieb', 'hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/wissensdatenbank', icon: 'ti-school', label: 'Schulungsplattform' },
  ] },
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
    { href: '/eric-privat/zieleboard', icon: 'ti-target-arrow', label: 'Zieleboard' },
    { href: '/eric-privat/quartalsplanung', icon: 'ti-calendar-stats', label: 'Quartalsplanung' },
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
  { type: 'link', href: '/ziele-entwicklung', icon: 'ti-target-arrow', label: 'Zieleentwicklung', area: ['vertrieb', 'hv'], mod: 'privat' },
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
  { v: 'wissen', label: 'Wissensdatenbank', icon: 'ti-book' },
]
export const GB_MAP = {
  ankauf: 'vertrieb', vermietung: 'vertrieb', crm: 'vertrieb', baustandard: 'vertrieb', assetmanagement: 'vertrieb', strategie: 'vertrieb',
  buchhaltung: 'buchhaltung', controlling: 'buchhaltung', finance: 'buchhaltung', 'assetmgmt-bh': 'vertrieb', stammdaten: 'buchhaltung',
  hausverwaltung: 'hausverwaltung', prozesse: 'hausverwaltung',
  produktivitaet: 'gf', personal: 'gf', 'eric-privat': 'gf',
  'gf-dashboard': 'gf', backoffice: 'gf', '/gf-dashboard': 'gf', '/beschluesse': 'gf', '/aktivitaeten': 'hausverwaltung', '/dokumente': 'buchhaltung', '/dms': 'buchhaltung', '/nutzer': 'gf',
  '/hausmeisterdienst': 'hausmeisterdienst', '/haushaltshilfe': 'gf', '/jahresplaner': 'gf', '/persoenliche-assistenz': 'gf', '/ziele-entwicklung': 'gf',
  wissensdatenbank: 'wissen',
}
export const gbOf = (n) => (n.type === 'group' ? GB_MAP[n.key] : GB_MAP[n.href])

export default function Sidebar({ user, demo, onLogout, role, perms }) {
  const path = usePathname()
  const [q, setQ] = useState('')
  const [favs, setFavs] = useState([])
  const [dragFav, setDragFav] = useState(null)
  const [favOpen, setFavOpen] = useState(true)
  const [openCats, setOpenCats] = useState(() => new Set())
  const isAdmin = role === 'admin'

  const has = (key) => !!(perms && Object.prototype.hasOwnProperty.call(perms, key))
  const on = (key) => { const p = perms && perms[key]; return !!(p && p.sehen) }
  // Wer die Rolle eines Geschäftsbereichs trägt, sieht dessen Einträge automatisch
  // (z. B. Rolle "hausverwaltung" → alle Kategorien/Links im Bereich Hausverwaltung).
  const roleOwnsBereich = (n) => !!role && gbOf(n) === role
  const canSeeItem = (n, it) => {
    if (demo || isAdmin) return true
    if (n.key === 'eric-privat') return isAdmin
    if (roleOwnsBereich(n)) return true
    if (!perms) return true
    const key = 'sub:' + it.href
    return has(key) ? on(key) : on(n.mod)
  }
  const canSee = (n) => {
    if (n.type === 'group') {
      if (demo || isAdmin) return true
      if (n.key === 'eric-privat') return isAdmin
      if (roleOwnsBereich(n)) return true
      if (!perms) return true
      const catKey = 'cat:' + n.key
      const base = has(catKey) ? on(catKey) : on(n.mod)
      return base || (n.items || []).some((it) => canSeeItem(n, it))
    }
    if (roleOwnsBereich(n)) return true
    if (!n.mod) return true
    if (demo || isAdmin) return true
    if (NODE_ADMIN_ONLY(n.mod)) return isAdmin
    if (!perms) return true
    const lnkKey = 'lnk:' + n.href
    return has(lnkKey) ? on(lnkKey) : on(n.mod)
  }

  useEffect(() => {
    try { const f = localStorage.getItem('sidebar_favs'); if (f) setFavs(JSON.parse(f)) } catch (e) {}
    try { const fo = localStorage.getItem('sidebar_fav_open'); if (fo != null) setFavOpen(fo !== '0') } catch (e) {}
    try { const oc = localStorage.getItem('sidebar_open_cats'); if (oc) setOpenCats(new Set(JSON.parse(oc))) } catch (e) {}
  }, [])
  useEffect(() => { setQ('') }, [path])
  // Favoriten-Änderungen an die linke Favoritenleiste (FavRail) melden
  useEffect(() => { try { window.dispatchEvent(new CustomEvent('wt-favs', { detail: favs })) } catch (e) {} }, [favs])
  // Favoriten-Änderungen von anderen Stellen (FavToggle/andere Tabs) übernehmen
  useEffect(() => {
    const apply = (arr) => setFavs((prev) => (JSON.stringify(prev) === JSON.stringify(arr) ? prev : arr))
    const onCustom = (e) => apply(Array.isArray(e.detail) ? e.detail : [])
    const onStorage = () => { try { const f = localStorage.getItem('sidebar_favs'); apply(f ? JSON.parse(f) : []) } catch (er) {} }
    window.addEventListener('wt-favs', onCustom)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('wt-favs', onCustom); window.removeEventListener('storage', onStorage) }
  }, [])

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
  const toggleFavOpen = () => setFavOpen((v) => { const n = !v; try { localStorage.setItem('sidebar_fav_open', n ? '1' : '0') } catch (e) {} return n })
  const toggleCat = (key) => setOpenCats((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    try { localStorage.setItem('sidebar_open_cats', JSON.stringify([...next])) } catch (e) {}
    return next
  })

  const email = user && user.email ? user.email : null
  const initials = email ? email.slice(0, 2).toUpperCase() : 'EE'

  const flatSearch = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) flatSearch.push({ href: n.href, label: n.label, icon: n.icon, group: '' }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) flatSearch.push({ href: it.href, label: it.label, icon: it.icon, group: n.label }) }) }
  })
  const ql = q.trim().toLowerCase()
  const results = ql ? flatSearch.filter((x) => (x.label + ' ' + x.group).toLowerCase().includes(ql)) : []

  // Aktive Gruppe/Link aus dem aktuellen Pfad
  const activeGroupPath = NAV.find((n) => n.type === 'group' && canSee(n) && n.items.some(isActive))
  const activeGroupKey = activeGroupPath ? activeGroupPath.key : null

  // Favoriten
  const allLeaf = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) allLeaf.push({ href: n.href, label: n.label, icon: n.icon }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) allLeaf.push({ href: it.href, label: it.label, icon: it.icon }) }) }
  })
  const favItems = favs.map((h) => allLeaf.find((x) => x.href === h)).filter(Boolean)
  const isRestricted = !!role && role !== 'admin'
  const FAV_PIN = { href: '/verbesserungen', label: 'Verbesserungsvorschläge', icon: 'ti-bulb' }
  const favView = [FAV_PIN, ...favItems.filter((x) => x.href !== '/verbesserungen')]

  const visibleNav = NAV.filter((n) => canSee(n))
  const catOpen = (n) => openCats.has(n.key) || n.key === activeGroupKey

  return (
    <aside className="sbx">
      <div className="sbx-brand-row">
        <Link href="/" className="sbx-brand" title="Zum Cockpit">
          <div className="logo">W</div>
          <div><div className="name">Wohntraum</div><div className="sub">Rheinhessen OS</div></div>
        </Link>
        {!demo && <button className="sbx-logout" title="Abmelden" onClick={onLogout}><i className="ti ti-logout" /></button>}
      </div>

      <div className="sbx-search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Thema suchen…" />
        {ql && (
          <div className="sbx-results">
            {results.length ? results.map((x) => (
              <Link key={x.href} href={x.href} className={isActive(x) ? 'active' : ''} onClick={() => setQ('')}>
                <i className={'ti ' + x.icon} /> {x.label}{x.group && <span className="grp">{x.group}</span>}
              </Link>
            )) : <div className="sbx-noresult">Kein Treffer für „{q}"</div>}
          </div>
        )}
      </div>

      {/* Favoriten – ganz oben, ein-/ausklappbar, per Drag & Drop umsortierbar */}
      <div className="sbx-sec">
        <button className="sbx-sechd" onClick={toggleFavOpen} title={favOpen ? 'Favoriten einklappen' : 'Favoriten ausklappen'}>
          <i className="ti ti-star" style={{ color: '#f5c518' }} /> <span>Favoriten</span>
          <i className={'ti ' + (favOpen ? 'ti-chevron-down' : 'ti-chevron-right')} style={{ marginLeft: 'auto', fontSize: 15 }} />
        </button>
        {favOpen && (
          <div className="sbx-favlist">
            {favView.length ? favView.map((it) => (
              <div key={it.href} className="sbx-favrow"
                draggable
                onDragStart={(e) => { setDragFav(it.href); e.dataTransfer.effectAllowed = 'move' }}
                onDragEnd={() => setDragFav(null)}
                onDragOver={(e) => { if (dragFav && dragFav !== it.href) e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, it.href); setDragFav(null) }}
                style={{ opacity: dragFav === it.href ? 0.4 : 1 }}
              >
                <i className="ti ti-grip-vertical grip" title="Ziehen zum Umsortieren" />
                <Link href={it.href} className={'sbx-link' + (isActive(it) ? ' active' : '')} onClick={() => setQ('')}>
                  <i className={'ti ' + it.icon} /> <span>{it.label}</span>
                </Link>
                {it.href !== '/verbesserungen' && (
                  <span className="sbx-star on" onClick={(e) => toggleFav(it.href, e)} title="Aus Favoriten entfernen">★</span>
                )}
              </div>
            )) : <div className="sbx-empty">Noch keine Favoriten – Stern ☆ neben einer Unterkategorie antippen.</div>}
            {dragFav && (
              <div className="sbx-dropend"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, null); setDragFav(null) }}
                title="Ans Ende verschieben">ans Ende</div>
            )}
          </div>
        )}
      </div>

      {/* Alle Kategorien & Unterkategorien */}
      <nav className="sbx-nav">
        {visibleNav.map((n) => {
          if (n.type === 'link') return (
            <div key={n.href} className="sbx-linkrow">
              <Link href={n.href} className={'sbx-link' + (isActive(n) ? ' active' : '')}>
                <i className={'ti ' + n.icon} /> <span>{n.label}</span>
              </Link>
              {n.mod && <span className={'sbx-star' + (isFav(n.href) ? ' on' : '')} onClick={(e) => toggleFav(n.href, e)} title={isFav(n.href) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>{isFav(n.href) ? '★' : '☆'}</span>}
            </div>
          )
          const vis = n.items.filter((it) => canSeeItem(n, it))
          if (!vis.length) return null
          const open = catOpen(n)
          return (
            <div key={n.key} className="sbx-cat">
              <button className={'sbx-catbtn' + (n.key === activeGroupKey ? ' active' : '')} onClick={() => toggleCat(n.key)}>
                <i className={'ti ' + n.icon} /> <span>{n.label}</span>
                <i className={'ti ' + (open ? 'ti-chevron-down' : 'ti-chevron-right')} style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.7 }} />
              </button>
              {open && (
                <div className="sbx-sub">
                  {vis.map((it) => (
                    <div key={it.href} className="sbx-subrow">
                      <Link href={it.href} className={'sbx-link' + (isActive(it) ? ' active' : '')}>
                        <i className={'ti ' + it.icon} /> <span>{it.label}</span>
                      </Link>
                      <span className={'sbx-star' + (isFav(it.href) ? ' on' : '')} onClick={(e) => toggleFav(it.href, e)} title={isFav(it.href) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>{isFav(it.href) ? '★' : '☆'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sbx-foot">
        <div className="av" title={email || 'Demo-Modus'}>{initials}</div>
        <div className="sbx-me">{email || 'Demo-Modus'}</div>
      </div>
    </aside>
  )
}
