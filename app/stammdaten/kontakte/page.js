'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { sampleContacts, roleLabel } from '@/lib/sampleData'
import ContactForm from '@/components/ContactForm'

export default function KontaktePage() {
  const [rows, setRows] = useState(sampleContacts)
  const [companies, setCompanies] = useState([])
  const [profiles, setProfiles] = useState([])
  const [live, setLive] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) return
    const { data, error } = await supabase
      .from('contacts')
      .select('*, company:companies(name), contact_roles(role)')
      .order('last_name', { ascending: true })
    if (error) { setError(error.message); return }
    setError(null)
    if (data) {
      setRows(data.map((c) => ({ ...c, roles: (c.contact_roles || []).map((r) => r.role) })))
      setLive(true)
    }
    const cs = await supabase.from('companies').select('id, name').order('name')
    if (!cs.error && cs.data) setCompanies(cs.data)
    const ps = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (!ps.error && ps.data) setProfiles(ps.data)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setModalOpen(true) }

  async function remove(c) {
    if (!supabase) return
    const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
    if (!window.confirm('Kontakt "' + name + '" wirklich löschen?')) return
    const { error } = await supabase.from('contacts').delete().eq('id', c.id)
    if (error) { alert('Löschen fehlgeschlagen: ' + error.message); return }
    load()
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Kontakte</h1>
          <div className="sub">{rows.length} Einträge · Stammdaten</div>
        </div>
        <div className="actions">
          <span className={'pill ' + (live ? 'live' : 'demo')}>{live ? 'Live-Daten' : 'Demo-Daten'}</span>
          <button className="btn" onClick={openNew}><i className="ti ti-plus" /> Neuer Kontakt</button>
        </div>
      </div>

      {error && <p className="err">Supabase: {error}</p>}
      {!supabaseConfigured && (
        <p className="sub" style={{ marginBottom: 12 }}>
          Demo-Modus — verbinde Supabase in .env.local und logge dich ein, um echte Daten zu speichern.
        </p>
      )}

      <table className="tbl">
        <thead>
          <tr><th>Name</th><th>Firma</th><th>Rolle(n)</th><th>E-Mail</th><th>Telefon</th><th>Ort</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><Link href={'/stammdaten/kontakte/' + c.id} style={{ color: 'var(--brand)', fontWeight: 500 }}>{[c.salutation, c.first_name, c.last_name].filter(Boolean).join(' ')}</Link></td>
              <td>{c.company ? c.company.name : '—'}</td>
              <td>{(c.roles || []).map((r) => <span key={r} className="badge">{roleLabel[r] || r}</span>)}</td>
              <td>{c.email || '—'}</td>
              <td>{c.phone_mobile || c.phone || '—'}</td>
              <td>{c.city || '—'}</td>
              <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                <button className="iconbtn" title="Bearbeiten" onClick={() => openEdit(c)}><i className="ti ti-edit" /></button>
                <button className="iconbtn" title="Löschen" onClick={() => remove(c)}><i className="ti ti-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <ContactForm
          initial={editing}
          companies={companies}
          profiles={profiles}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </>
  )
}
