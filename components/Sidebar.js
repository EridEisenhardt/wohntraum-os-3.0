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

      <div className="nav-group">
        <i className="ti ti-clipboard-list lead" /> Planung
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/planung/baustandard" className={subCls(path.startsWith('/planung/baustandard'))}>
        <i className="ti ti-ruler-2" /> Baustandard
      </Link>

      <Link href="/aktivitaeten" className={cls(path.startsWith('/aktivitaeten'))}>
        <i className="ti ti-checklist" /> Aktivitäten
      </Link>

      <div className="nav-group">
        <i className="ti ti-cash lead" /> Finance
        <i className="ti ti-chevron-down chev" />
      </div>
      <Link href="/finance/darlehen" className={subCls(path.startsWith('/finance/darlehen'))}>
        <i className="ti ti-businessplan" /> Darlehen
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
