'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { docCategoryLabel, expiryInfo } from '@/lib/dms'

export default function Cockpit() {
  const [counts, setCounts] = useState({ contacts: 248, companies: 37, documents: 0 })
  const [expiring, setExpiring] = useState([])
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return
    ;(async () => {
      const a = await supabase.from('contacts').select('*', { count: 'exact', head: true })
      const b = await supabase.from('companies').select('*', { count: 'exact', head: true })
      const c = await supabase.from('documents').select('*', { count: 'exact', head: true })
      if (!a.error && !b.error) {
        setCounts({ contacts: a.count || 0, companies: b.count || 0, documents: (c && c.count) || 0 })
        setLive(true)
      }
      const soon = new Date(); soon.setDate(soon.getDate() + 60)
      const { data } = await supabase
        .from('documents')
        .select('id, title, category, expires_at')
        .not('expires_at', 'is', null)
        .lte('expires_at', soon.toISOString().slice(0, 10))
        .order('expires_at', { ascending: true })
        .limit(6)
      if (data) setExpiring(data)
    })()
  }, [])

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
        <div className="kpi"><div className="label">Offene Aufgaben</div><div className="val">9</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Letzte Aktivitäten</h2>
          <div className="row"><i className="ti ti-phone" /> Anruf · M. Becker (Käufer)<span className="time">vor 2 Std.</span></div>
          <div className="row"><i className="ti ti-eye" /> Besichtigung · Wohnung Mainz-Neustadt<span className="time">gestern</span></div>
          <div className="row"><i className="ti ti-mail" /> E-Mail · Notariat Dr. Wolf<span className="time">gestern</span></div>
          <div className="row"><i className="ti ti-note" /> Notiz · Eigentümer Familie Lang<span className="time">Fr.</span></div>
        </div>
        <div className="card">
          <h2>Bald ablaufende Dokumente</h2>
          {expiring.length === 0 && <div className="sub">Keine ablaufenden Dokumente.</div>}
          {expiring.map((d) => {
            const exp = expiryInfo(d.expires_at)
            return (
              <div className="row" key={d.id}>
                <i className="ti ti-file-alert" />
                <Link href="/dokumente" style={{ color: 'inherit' }}>{d.title}</Link>
                <span className="time">{exp ? exp.label : ''}</span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
