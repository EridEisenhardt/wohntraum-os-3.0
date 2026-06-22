'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { companyTypeLabel, roleLabel } from '@/lib/sampleData'
import { activityTypeLabel, activityTypeIcon } from '@/lib/activities'
import { docCategoryLabel } from '@/lib/dms'
import CompanyForm from '@/components/CompanyForm'
import ActivityGlobalForm from '@/components/ActivityGlobalForm'

export default function FirmaDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])
  const [acts, setActs] = useState([])
  const [docs, setDocs] = useState([])
  const [allContacts, setAllContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCompany, setEditCompany] = useState(false)
  const [actModal, setActModal] = useState(false)
  const [editAct, setEditAct] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    const { data } = await supabase.from('companies').select('*').eq('id', id).single()
    if (data) setCompany(data)
    const c = await supabase
      .from('contacts')
      .select('id, salutation, first_name, last_name, email, phone_mobile, contact_roles(role)')
      .eq('company_id', id).order('last_name', { ascending: true })
    if (c.data) setContacts(c.data.map((x) => ({ ...x, roles: (x.contact_roles || []).map((r) => r.role) })))
    const a = await supabase.from('activities').select('*').eq('company_id', id).order('occurred_at', { ascending: false })
    if (a.data) setActs(a.data)
    const d = await supabase.from('documents').select('id, title, category, created_at').eq('company_id', id).order('created_at', { ascending: false })
    if (d.data) setDocs(d.data)
    const cs = await supabase.from('companies').select('id, name').order('name')
    if (cs.data) setCompanies(cs.data)
    const ac = await supabase.from('contacts').select('id, first_name, last_name').order('last_name')
    if (ac.data) setAllContacts(ac.data)
    const ps = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (ps.data) setProfiles(ps.data)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const profName = (uid) => {
    const p = profiles.find((x) => x.id === uid)
    return p ? (p.full_name || p.email) : '—'
  }
  const fmt = (d) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  async function toggleDone(a) {
    await supabase.from('activities').update({ is_done: !a.is_done }).eq('id', a.id)
    load()
  }
  async function removeAct(a) {
    if (!window.confirm('Aktivität löschen?')) return
    await supabase.from('activities').delete().eq('id', a.id)
    load()
  }

  if (!supabaseConfigured) return <p className="sub">Bitte Supabase verbinden und einloggen.</p>
  if (loading) return <p className="sub">Lädt…</p>
  if (!company) return (
    <>
      <span className="backlink" onClick={() => router.push('/stammdaten/firmen')}><i className="ti ti-arrow-left" /> Zurück</span>
      <p className="sub">Firma nicht gefunden.</p>
    </>
  )

  const initials = (company.name || 'F').slice(0, 2).toUpperCase()
  const addr = [company.street, [company.postal_code, company.city].filter(Boolean).join(' '), company.region].filter(Boolean).join(', ')

  return (
    <>
      <Link href="/stammdaten/firmen" className="backlink"><i className="ti ti-arrow-left" /> Firmen</Link>

      <div className="detail-head">
        <div className="avatar-lg"><i className="ti ti-building" /></div>
        <div style={{ flex: 1 }}>
          <h1>{company.name}</h1>
          <div style={{ marginTop: 4 }}>
            <span className="badge">{companyTypeLabel[company.company_type] || company.company_type || '—'}</span>
            {company.city && <span className="sub" style={{ marginLeft: 6 }}>· {company.city}</span>}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setEditCompany(true)}><i className="ti ti-edit" /> Bearbeiten</button>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center' }}>
              Aktivitäten
              <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => { setEditAct(null); setActModal(true) }}>
                <i className="ti ti-plus" /> Neu
              </button>
            </h2>
            {acts.length === 0 && <div className="sub">Noch keine Aktivitäten erfasst.</div>}
            <div className="timeline">
              {acts.map((a) => (
                <div className="tl-item" key={a.id}>
                  <div className="tl-ic"><i className={'ti ' + (activityTypeIcon[a.type] || 'ti-note')} /></div>
                  <div className="tl-main">
                    <div className="tl-top">
                      <span className={'ttl' + (a.type === 'aufgabe' && a.is_done ? ' tl-done' : '')}>
                        {a.subject || activityTypeLabel[a.type]}
                      </span>
                      <span className="badge">{activityTypeLabel[a.type]}</span>
                      <span className="tl-time">{fmt(a.occurred_at)}</span>
                    </div>
                    {a.body && <div className="tl-body">{a.body}</div>}
                    {a.type === 'aufgabe' && a.due_at && <div className="sub" style={{ marginTop: 3 }}>fällig: {fmt(a.due_at)}</div>}
                    <div style={{ marginTop: 4 }}>
                      {a.type === 'aufgabe' && (
                        <button className="iconbtn" title={a.is_done ? 'als offen markieren' : 'als erledigt markieren'} onClick={() => toggleDone(a)}>
                          <i className={'ti ' + (a.is_done ? 'ti-circle-check' : 'ti-circle')} />
                        </button>
                      )}
                      <button className="iconbtn" title="Bearbeiten" onClick={() => { setEditAct(a); setActModal(true) }}><i className="ti ti-edit" /></button>
                      <button className="iconbtn" title="Löschen" onClick={() => removeAct(a)}><i className="ti ti-trash" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Kontakte dieser Firma</h2>
            {contacts.length === 0 && <div className="sub">Keine Kontakte zugeordnet.</div>}
            {contacts.map((c) => (
              <div className="doc-link" key={c.id}>
                <i className="ti ti-user" style={{ color: 'var(--brand)' }} />
                <Link href={'/stammdaten/kontakte/' + c.id} style={{ color: 'inherit' }}>
                  {[c.salutation, c.first_name, c.last_name].filter(Boolean).join(' ')}
                </Link>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  {(c.roles || []).map((r) => <span key={r} className="badge">{roleLabel[r] || r}</span>)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <h2>Firmendaten</h2>
            <div className="info-row"><span className="k">Typ</span><span className="v">{companyTypeLabel[company.company_type] || company.company_type || '—'}</span></div>
            <div className="info-row"><span className="k">E-Mail</span><span className="v">{company.email || '—'}</span></div>
            <div className="info-row"><span className="k">Telefon</span><span className="v">{company.phone || '—'}</span></div>
            <div className="info-row"><span className="k">Website</span><span className="v">{company.website || '—'}</span></div>
            <div className="info-row"><span className="k">Adresse</span><span className="v">{addr || '—'}</span></div>
            <div className="info-row"><span className="k">USt-IdNr.</span><span className="v">{company.vat_id || '—'}</span></div>
            <div className="info-row"><span className="k">Zuständig</span><span className="v">{company.assigned_to ? profName(company.assigned_to) : '—'}</span></div>
          </div>

          {company.notes && (
            <div className="card">
              <h2>Notizen</h2>
              <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{company.notes}</div>
            </div>
          )}

          <div className="card">
            <h2>Dokumente</h2>
            {docs.length === 0 && <div className="sub">Keine verknüpften Dokumente.</div>}
            {docs.map((d) => (
              <div className="doc-link" key={d.id}>
                <i className="ti ti-file" style={{ color: 'var(--brand)' }} />
                <Link href="/dokumente" style={{ color: 'inherit' }}>{d.title}</Link>
                <span className="badge" style={{ marginLeft: 'auto' }}>{docCategoryLabel[d.category] || d.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editCompany && (
        <CompanyForm initial={company} profiles={profiles}
          onClose={() => setEditCompany(false)} onSaved={() => { setEditCompany(false); load() }} />
      )}
      {actModal && (
        <ActivityGlobalForm
          initial={editAct || { company_id: company.id }}
          contacts={allContacts} companies={companies} profiles={profiles}
          onClose={() => setActModal(false)} onSaved={() => { setActModal(false); load() }} />
      )}
    </>
  )
}
