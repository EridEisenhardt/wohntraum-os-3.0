'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { sampleCompanies, companyTypeLabel } from '@/lib/sampleData'
import CompanyForm from '@/components/CompanyForm'

export default function FirmenPage() {
  const [rows, setRows] = useState(sampleCompanies)
  const [profiles, setProfiles] = useState([])
  const [live, setLive] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) return
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })
    if (error) { setError(error.message); return }
    setError(null)
    if (data) { setRows(data); setLive(true) }
    const ps = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (!ps.error && ps.data) setProfiles(ps.data)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (f) => { setEditing(f); setModalOpen(true) }

  async function remove(f) {
    if (!supabase) return
    if (!window.confirm('Firma "' + f.name + '" wirklich löschen?')) return
    const { error } = await supabase.from('companies').delete().eq('id', f.id)
    if (error) { alert('Löschen fehlgeschlagen: ' + error.message); return }
    load()
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Firmen</h1>
          <div className="sub">{rows.length} Einträge · Stammdaten</div>
        </div>
        <div className="actions">
          <span className={'pill ' + (live ? 'live' : 'demo')}>{live ? 'Live-Daten' : 'Demo-Daten'}</span>
          <button className="btn" onClick={openNew}><i className="ti ti-plus" /> Neue Firma</button>
        </div>
      </div>

      {error && <p className="err">Supabase: {error}</p>}

      <table className="tbl">
        <thead>
          <tr><th>Name</th><th>Typ</th><th>Ort</th><th>Telefon</th><th>E-Mail</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td>{f.name}</td>
              <td><span className="badge">{companyTypeLabel[f.company_type] || f.company_type || '—'}</span></td>
              <td>{f.city || '—'}</td>
              <td>{f.phone || '—'}</td>
              <td>{f.email || '—'}</td>
              <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                <button className="iconbtn" title="Bearbeiten" onClick={() => openEdit(f)}><i className="ti ti-edit" /></button>
                <button className="iconbtn" title="Löschen" onClick={() => remove(f)}><i className="ti ti-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <CompanyForm
          initial={editing}
          profiles={profiles}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </>
  )
}
