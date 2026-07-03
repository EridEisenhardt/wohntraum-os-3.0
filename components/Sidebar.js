'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ user, demo, onLogout }) {
  const path = usePathname()
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

      <Link href="/" className={cls(path === '/')}>
        <i className="ti ti-layout-dashboard" /> Cockpit
      </Link>

      <Link href="/gf-dashboard" className={cls(path.startsWith('/gf-dashboard'))}>
        <i className="ti ti-chart-pie" /> GF-Dashboard
      </Link>

      <Link href="/portfolio" className={cls(path.startsWith('/portfolio'))}>
        <i className="ti ti-building-community" /> Portfolio
      </Link>

      <div className="nav-group">
        <i className="ti ti-chess lead" /> Strategie
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/strategie/veraenderungen" className={subCls(path.startsWith('/strategie/veraenderungen'))}>
        <i className="ti ti-arrows-shuffle" /> Veränderungen in der Organisation
      </Link>

      <div className="nav-group">
        <i className="ti ti-ruler-2 lead" /> Baustandard
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/planung/baustandard" className={subCls(path.startsWith('/planung/baustandard'))}>
        <i className="ti ti-ruler-2" /> Baustandard
      </Link>
      <Link href="/planung/materialliste" className={subCls(path.startsWith('/planung/materialliste'))}>
        <i className="ti ti-list-details" /> Materialliste
      </Link>

      <Link href="/aktivitaeten" className={cls(path.startsWith('/aktivitaeten'))}>
        <i className="ti ti-checklist" /> Aktivitäten
      </Link>

      <div className="nav-group">
        <i className="ti ti-home-search lead" /> Vermietung
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/vermietung/steckbrief" className={subCls(path.startsWith('/vermietung/steckbrief'))}>
        <i className="ti ti-id-badge-2" /> Steckbrief Generator
      </Link>
      <Link href="/vermietung/laufende-vermietungen" className={subCls(path.startsWith('/vermietung/laufende-vermietungen'))}>
        <i className="ti ti-progress" /> Laufende Vermietungen
      </Link>
      <Link href="/vermietung/zahlungsvereinbarung" className={subCls(path.startsWith('/vermietung/zahlungsvereinbarung'))}>
        <i className="ti ti-file-dollar" /> Zahlungsvereinbarungsgenerator
      </Link>

      <div className="nav-group">
        <i className="ti ti-chart-histogram lead" /> Controlling
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/controlling/statistik" className={subCls(path.startsWith('/controlling/statistik'))}>
        <i className="ti ti-chart-bar" /> Statistik
      </Link>
      <Link href="/controlling/monatswechsel" className={subCls(path.startsWith('/controlling/monatswechsel'))}>
        <i className="ti ti-calendar-dollar" /> Monatswechsel
      </Link>
      <Link href="/controlling/nahaus-fixkosten" className={subCls(path.startsWith('/controlling/nahaus-fixkosten'))}>
        <i className="ti ti-file-invoice" /> Fixkosten Objekte
      </Link>
      <Link href="/controlling/nahaus-rechnungen" className={subCls(path.startsWith('/controlling/nahaus-rechnungen'))}>
        <i className="ti ti-receipt" /> Rechnungen Unternehmen
      </Link>

      <div className="nav-group">
        <i className="ti ti-rocket lead" /> Produktivität
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/produktivitaet/tracking" className={subCls(path.startsWith('/produktivitaet/tracking'))}>
        <i className="ti ti-chart-line" /> Tracking
      </Link>
      <Link href="/produktivitaet/planung" className={subCls(path.startsWith('/produktivitaet/planung'))}>
        <i className="ti ti-calendar-event" /> Wochenplanung
      </Link>
      <Link href="/produktivitaet/ideale-woche" className={subCls(path.startsWith('/produktivitaet/ideale-woche'))}>
        <i className="ti ti-calendar-heart" /> Ideale Woche
      </Link>
      <Link href="/produktivitaet/statusbericht" className={subCls(path.startsWith('/produktivitaet/statusbericht'))}>
        <i className="ti ti-clipboard-check" /> Statusbericht GF
      </Link>
      <Link href="/produktivitaet/stundengehalt" className={subCls(path.startsWith('/produktivitaet/stundengehalt'))}>
        <i className="ti ti-clock-dollar" /> Stundengehalt
      </Link>

      <div className="nav-group">
        <i className="ti ti-cash lead" /> Finance
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/finance/darlehen" className={subCls(path === '/finance/darlehen' || path.startsWith('/finance/darlehen/'))}>
        <i className="ti ti-businessplan" /> Darlehen
      </Link>
      <Link href="/finance/darlehensgenerator" className={subCls(path.startsWith('/finance/darlehensgenerator'))}>
        <i className="ti ti-calculator" /> Darlehensgenerator
      </Link>
      <Link href="/finance/selbstauskunft" className={subCls(path.startsWith('/finance/selbstauskunft'))}>
        <i className="ti ti-user-search" /> Selbstauskunft für die Bank
      </Link>
      <Link href="/finance/reporting" className={subCls(path.startsWith('/finance/reporting'))}>
        <i className="ti ti-report-analytics" /> Reporting für die Bank
      </Link>
      <Link href="/finance/steuer-bilanz" className={subCls(path.startsWith('/finance/steuer-bilanz'))}>
        <i className="ti ti-receipt-tax" /> Steuer und Bilanzunterlagen
      </Link>
      <Link href="/finance/liquiditaetsplanung" className={subCls(path.startsWith('/finance/liquiditaetsplanung'))}>
        <i className="ti ti-wallet" /> Liquiditätsplanung
      </Link>

      <Link href="/dokumente" className={cls(path.startsWith('/dokumente'))}>
        <i className="ti ti-files" /> Dokumente
      </Link>

      <div className="nav-group">
        <i className="ti ti-database lead" /> Stammdaten
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/stammdaten/kontakte" className={subCls(path.startsWith('/stammdaten/kontakte'))}>
        <i className="ti ti-users" /> Kontakte
      </Link>
      <Link href="/stammdaten/firmen" className={subCls(path.startsWith('/stammdaten/firmen'))}>
        <i className="ti ti-building" /> Firmen
      </Link>

      <div className="nav-group">
        <i className="ti ti-users-group lead" /> Personal
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/personal/akte" className={subCls(path.startsWith('/personal/akte'))}>
        <i className="ti ti-id" /> Personalakte
      </Link>
      <Link href="/personal/urlaub" className={subCls(path.startsWith('/personal/urlaub'))}>
        <i className="ti ti-beach" /> Urlaub
      </Link>
      <Link href="/personal/krankheit" className={subCls(path.startsWith('/personal/krankheit'))}>
        <i className="ti ti-vaccine" /> Krankheit
      </Link>
      <Link href="/personal/arbeitsstunden" className={subCls(path.startsWith('/personal/arbeitsstunden'))}>
        <i className="ti ti-clock-hour-4" /> Arbeitsstunden
      </Link>
      <Link href="/personal/lohnkosten" className={subCls(path.startsWith('/personal/lohnkosten'))}>
        <i className="ti ti-coin-euro" /> Lohnkosten
      </Link>

      <div className="nav-group">
        <i className="ti ti-user-heart lead" /> Eric Privat
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/eric-privat/budgetplan" className={subCls(path.startsWith('/eric-privat/budgetplan'))}>
        <i className="ti ti-wallet" /> Budgetplan
      </Link>

      <Link href="/nutzer" className={cls(path.startsWith('/nutzer'))}>
        <i className="ti ti-shield-lock" /> Nutzerverwaltung
      </Link>

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
