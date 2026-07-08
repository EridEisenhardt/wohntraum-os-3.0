'use client'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { NAV } from '../../components/Sidebar'

function buildItems() {
  const items = []
  NAV.forEach((n) => {
    if (n.href === '/tools') return
    if (n.type === 'link') items.push({ href: n.href, label: n.label, icon: n.icon, cat: 'Direktzugriff' })
    else n.items.forEach((it) => items.push({ href: it.href, label: it.label, icon: it.icon, cat: n.label }))
  })
  return items
}

export default function ToolsPage() {
  const [q, setQ] = useState('')
  const items = useMemo(buildItems, [])
  const query = q.trim().toLowerCase()
  const filtered = query ? items.filter((i) => (i.label + ' ' + i.cat).toLowerCase().includes(query)) : items

  const cats = []
  const byCat = {}
  filtered.forEach((i) => { if (!byCat[i.cat]) { byCat[i.cat] = []; cats.push(i.cat) } byCat[i.cat].push(i) })

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Alle Tools</h1>
        <span style={{ fontSize: 13, color: 'var(--hint, #6b7280)' }}>{items.length} Seiten</span>
        <div style={{ flex: 1 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tool suchen …"
          autoFocus
          style={{ minWidth: 240, fontSize: 14, padding: '9px 12px', border: '1px solid var(--border, #e6e8ec)', borderRadius: 10, background: 'var(--surf, #fff)', outline: 'none' }}
        />
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--hint, #6b7280)', margin: '0 0 18px' }}>
        Übersicht aller Bereiche und Seiten. Tippe oben, um schnell zu einer Seite zu springen.
      </p>

      {cats.map((cat) => (
        <div key={cat} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--hint, #6b7280)', margin: '0 0 8px' }}>{cat}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
            {byCat[cat].map((i) => (
              <Link key={i.href} href={i.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', border: '1px solid var(--border, #e6e8ec)', borderRadius: 11, background: 'var(--surf, #fff)', cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent, #185fa5)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border, #e6e8ec)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surf2, #f1f3f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent, #185fa5)', flex: '0 0 auto' }}>
                    <i className={'ti ' + i.icon} style={{ fontSize: 18 }} />
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{i.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {cats.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--hint, #6b7280)' }}>Keine Seite gefunden für „{q}“.</div>
      )}
    </div>
  )
}
