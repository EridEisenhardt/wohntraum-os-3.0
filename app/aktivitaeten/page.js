'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { activityTypeLabel, activityTypeIcon, ACTIVITY_TYPES } from '@/lib/activities'
import ActivityGlobalForm from '@/components/ActivityGlobalForm'

export default function AktivitaetenPage() {
  const [rows, setRows] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeF, setTypeF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [qType, setQType] = useState('notiz')
  const [qSubject, setQSubject] = useState('')

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    const { data } = await supabase
      .from('activities')
      .select('*, contact:contacts(first_name,last_name), company:companies(name)')
      .order('occurred_at', { ascending: false })
    if (data) setRows(data)
    const cs = await supabase.from('contacts').select('id, first_name, last_name').order('last_name'); if (cs.data) setContacts(cs.data)
    const fs = await supabase.from('companies').select('id, name').order('name'); if (fs.data) setCompanies(fs.data)
    const ps = await supabase.from('profiles').select('id, full_name, email').order('full_name'); if (ps.data) setProfiles(ps.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const profName = (uid) => { const p = profiles.find((x) => x.id === uid); return p ? (p.full_name || p.email) : '—' }
  const linkOf = (a) => a.contact ? { label: [a.contact.first_name, a.contact.last_name].filter(Boolean).join(' '), href: '/stammdaten/kontakte/' + a.contact_id } : (a.company ? { label: a.company.name, href: '/stammdaten/firmen' } : null)
  const fmt = (d) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const isOverdue = (a) => a.type === 'aufgabe' && !a.is_done && a.due_at && new Date(a.due_at) < new Date()

  async function quickAdd(e) {
    e.preventDefault()
    if (!supabase || !qSubject.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('activities').insert({
      type: qType, subject: qSubject.trim(), occurred_at: new Date().toISOString(), created_by: user ? user.id : null
    })
    if (error) { alert('Fehler: ' + error.message); return }
    setQSubject(''); load()
  }

  async function toggleDone(a) { await supabase.from('activities').update({ is_done: !a.is_done }).eq('id', a.id); load() }
  async function remove(a) {
    if (!window.confirm('Aktivität löschen?')) return
    await supabase.from('activities').delete().eq('id', a.id); load()
  }

  const filtered = rows.filter((a) => {
    if (typeF && a.type !== typeF) return false
    if (statusF === 'aufgaben' && a.type !== 'aufgabe') return false
    if (statusF === 'offen' && !(a.type === 'aufgabe' && !a.is_done)) return false
    if (statusF === 'erledigt' && !a.is_done) return false
    if (statusF === 'ueberfaellig' && !isOverdue(a)) return false
    if (query) {
      const q = query.toLowerCase()
      const lk = linkOf(a)
      const hay = [a.subject, a.body, lk && lk.label, activityTypeLabel[a.type]].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const openTasks = rows.filter((a) => a.type === 'aufgabe' && !a.is_done).length
  const overdue = rows.filter(isOverdue).length

  if (!supabaseConfigured) return <p className="sub">Bitte Supabase verbinden und einloggen.</p>

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Aktivitäten</h1>
          <div className="sub">{rows.length} gesamt · {openTasks} offene Aufgaben{overdue ? ' · ' + overdue + ' überfällig' : ''}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setEditing(null); setModal(true) }}><i className="ti ti-plus" /> Neu (mit Details)</button>
        </div>
      </div>

      <form className="quickadd" onSubmit={quickAdd}>
        <select value={qType} onChange={(e) => setQType(e.target.value)}>
          {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{activityTypeLabel[t]}</option>)}
        </select>
        <input className="qsubject" value={qSubject} onChange={(e) => setQSubject(e.target.value)} placeholder="Schnell erfassen: Betreff eingeben und Enter…" />
        <button className="btn" type="submit"><i className="ti ti-bolt" /> Hinzufügen</button>
      </form>

      <div className="toolbar">
        <div className="search" style={{ flex: 1 }}>
          <i className="ti ti-search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suche Betreff, Notiz, Verknüpfung…"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }} />
        </div>
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)}>
          <option value="">Alle Arten</option>
          {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{activityTypeLabel[t]}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="">Alle</option>
          <option value="aufgaben">Nur Aufgaben</option>
          <option value="offen">Offene Aufgaben</option>
          <option value="ueberfaellig">Überfällig</option>
          <option value="erledigt">Erledigt</option>
        </select>
      </div>

      {loading ? <p className="sub">Lädt…</p> : (
        <table className="tbl">
          <thead>
            <tr><th>Art</th><th>Betreff</th><th>Verknüpfung</th><th>Zeitpunkt / Fällig</th><th>Zuständig</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const lk = linkOf(a)
              const over = isOverdue(a)
              return (
                <tr key={a.id}>
                  <td><i className={'ti ' + (activityTypeIcon[a.type] || 'ti-note')} style={{ color: 'var(--brand)', marginRight: 6 }} />{activityTypeLabel[a.type]}</td>
                  <td style={{ textDecoration: a.type === 'aufgabe' && a.is_done ? 'line-through' : 'none', color: a.type === 'aufgabe' && a.is_done ? 'var(--muted)' : 'inherit' }}>
                    {a.subject || '—'}
                  </td>
                  <td>{lk ? <Link href={lk.href} style={{ color: 'var(--brand)' }}>{lk.label}</Link> : '—'}</td>
                  <td>
                    {a.type === 'aufgabe' && a.due_at
                      ? <span className={over ? 'pill over' : ''}>{over ? 'überfällig: ' : 'fällig: '}{fmt(a.due_at)}</span>
                      : fmt(a.occurred_at)}
                  </td>
                  <td>{a.assigned_to ? profName(a.assigned_to) : '—'}</td>
                  <td>
                    {a.type === 'aufgabe'
                      ? <button className="iconbtn" title={a.is_done ? 'als offen' : 'als erledigt'} onClick={() => toggleDone(a)}>
                          <span className={'pill ' + (a.is_done ? 'done' : 'open')}>{a.is_done ? 'erledigt' : 'offen'}</span>
                        </button>
                      : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="iconbtn" title="Bearbeiten" onClick={() => { setEditing(a); setModal(true) }}><i className="ti ti-edit" /></button>
                    <button className="iconbtn" title="Löschen" onClick={() => remove(a)}><i className="ti ti-trash" /></button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Keine Aktivitäten.</td></tr>}
          </tbody>
        </table>
      )}

      {modal && (
        <ActivityGlobalForm initial={editing} contacts={contacts} companies={companies} profiles={profiles}
          onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />
      )}
    </>
  )
}
