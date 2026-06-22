'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { expiryInfo } from '@/lib/dms'
import { activityTypeLabel, activityTypeIcon } from '@/lib/activities'
import { roleLabel } from '@/lib/sampleData'

const ROLE_COLORS = {
  kaeufer: '#378ADD', verkaeufer: '#1D9E75', mieter: '#EF9F27',
  partner: '#7F77DD', notar: '#7F77DD', finanzierer: '#7F77DD'
}

function relTime(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  const abs = Math.abs(diff)
  const past = diff >= 0
  let s
  if (abs < 3600) s = Math.round(abs / 60) + ' Min.'
  else if (abs < 86400) s = Math.round(abs / 3600) + ' Std.'
  else if (abs < 86400 * 30) s = Math.round(abs / 86400) + ' T.'
  else s = new Date(d).toLocaleDateString('de-DE')
  if (abs >= 86400 * 30) return s
  return past ? 'vor ' + s : 'in ' + s
}

export default function Cockpit() {
  const [counts, setCounts] = useState({ contacts: 0, companies: 0, documents: 0, openTasks: 0 })
  const [recent, setRecent] = useState([])
  const [tasks, setTasks] = useState([])
  const [expiring, setExpiring] = useState([])
  const [roles, setRoles] = useState([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return
    ;(async () => {
      const [a, b, c, t] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('type', 'aufgabe').eq('is_done', false)
      ])
      setCounts({
        contacts: a.count || 0, companies: b.count || 0,
        documents: c.count || 0, openTasks: t.count || 0
      })
      setLive(true)

      const r = await supabase
        .from('activities')
        .select('id, type, subject, occurred_at, contact:contacts(first_name,last_name), company:companies(name)')
        .order('occurred_at', { ascending: false }).limit(6)
      if (r.data) setRecent(r.data)

      const tk = await supabase
        .from('activities')
        .select('id, subject, due_at, contact:contacts(first_name,last_name), company:companies(name)')
        .eq('type', 'aufgabe').eq('is_done', false)
        .order('due_at', { ascending: true, nullsFirst: false }).limit(6)
      if (tk.data) setTasks(tk.data)

      const soon = new Date(); soon.setDate(soon.getDate() + 60)
      const ex = await supabase
        .from('documents').select('id, title, category, expires_at')
        .not('expires_at', 'is', null)
        .lte('expires_at', soon.toISOString().slice(0, 10))
        .order('expires_at', { ascending: true }).limit(6)
      if (ex.data) setExpiring(ex.data)

      const cr = await supabase.from('contact_roles').select('role')
      if (cr.data) {
        const tally = {}
        cr.data.forEach((x) => { tally[x.role] = (tally[x.role] || 0) + 1 })
        setRoles(Object.entries(tally).sort((a, b) => b[1] - a[1]))
      }
    })()
  }, [])

  const linkName = (x) => x.contact ? [x.contact.first_name, x.contact.last_name].filter(Boolean).join(' ')
    : (x.company ? x.company.name : null)
  const fmtDue = (d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Cockpit</h1>
          <div className="date">Überblick · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="actions">
          <span className={'pill ' + (live ? 'live' : 'demo')}>{live ? 'Live-Daten' : 'Demo-Daten'}</span>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Kontakte</div><div className="val">{counts.contacts}</div></div>
        <div className="kpi"><div className="label">Firmen</div><div className="val">{counts.companies}</div></div>
        <div className="kpi"><div className="label">Dokumente</div><div className="val">{counts.documents}</div></div>
        <div className="kpi"><div className="label">Offene Aufgaben</div><div className="val">{counts.openTasks}</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            Letzte Aktivitäten
            <Link href="/aktivitaeten" className="sub" style={{ marginLeft: 'auto', fontSize: 12 }}>alle ansehen</Link>
          </h2>
          {recent.length === 0 && <div className="sub">Noch keine Aktivitäten erfasst.</div>}
          {recent.map((a) => (
            <div className="row" key={a.id}>
              <i className={'ti ' + (activityTypeIcon[a.type] || 'ti-note')} />
              <span>{activityTypeLabel[a.type]}{(a.subject || linkName(a)) ? ' · ' : ''}{a.subject || linkName(a) || ''}</span>
              <span className="time">{relTime(a.occurred_at)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            Offene Aufgaben
            <Link href="/aktivitaeten" className="sub" style={{ marginLeft: 'auto', fontSize: 12 }}>zur Liste</Link>
          </h2>
          {tasks.length === 0 && <div className="sub">Keine offenen Aufgaben. 🎉</div>}
          {tasks.map((a) => {
            const overdue = a.due_at && new Date(a.due_at) < new Date()
            return (
              <div className="row" key={a.id}>
                <i className="ti ti-checkbox" style={{ color: overdue ? '#c0392b' : 'var(--brand)' }} />
                <span>{a.subject || 'Aufgabe'}{linkName(a) ? ' · ' + linkName(a) : ''}</span>
                <span className="time">{a.due_at ? (overdue ? <span style={{ color: '#c0392b', fontWeight: 500 }}>überfällig {fmtDue(a.due_at)}</span> : 'fällig ' + fmtDue(a.due_at)) : 'ohne Datum'}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            Bald ablaufende Dokumente
            <Link href="/dokumente" className="sub" style={{ marginLeft: 'auto', fontSize: 12 }}>zum DMS</Link>
          </h2>
          {expiring.length === 0 && <div className="sub">Keine ablaufenden Dokumente.</div>}
          {expiring.map((d) => {
            const exp = expiryInfo(d.expires_at)
            return (
              <div className="row" key={d.id}>
                <i className="ti ti-file-alert" />
                <Link href="/dokumente" style={{ color: 'inherit' }}>{d.title}</Link>
                <span className="time" style={exp && exp.kind !== 'ok' ? { color: '#c0392b', fontWeight: 500 } : {}}>{exp ? exp.label : ''}</span>
              </div>
            )
          })}
        </div>

        <div className="card">
          <h2>Kontakte nach Rolle</h2>
          {roles.length === 0 && <div className="sub">Noch keine Rollen vergeben.</div>}
          {roles.map(([role, n]) => (
            <div className="legend" key={role}>
              <span className="dot" style={{ background: ROLE_COLORS[role] || '#888' }} />
              {roleLabel[role] || role}
              <span className="n">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
