'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { roleLabel } from '@/lib/sampleData'
import { activityTypeLabel, activityTypeIcon } from '@/lib/activities'
import { docCategoryLabel } from '@/lib/dms'
import ContactForm from '@/components/ContactForm'
import ActivityForm from '@/components/ActivityForm'

export default function KontaktDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [contact, setContact] = useState(null)
  const [acts, setActs] = useState([])
  const [docs, setDocs] = useState([])
  const [companies, setCompanies] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editContact, setEditContact] = useState(false)
  const [actModal, setActModal] = useState(false)
  const [editAct, setEditAct] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    const { data } = await supabase
      .from('contacts')
      .select('*, company:companies(id,name), contact_roles(role)')
      .eq('id', id).single()
    if (data) setContact({ ...data, roles: (data.contact_roles || []).map((r) => r.role) })
    const a = await supabase.from('activities').select('*').eq('contact_id', id).order('occurred_at', { ascending: false })
    if (a.data) setActs(a.data)
    const d = await supabase.from('documents').select('id, title, category, created_at').eq('contact_id', id).order('created_at', { ascending: false })
    if (d.data) setDocs(d.data)
    const cs = await supabase.from('companies').select('id, name').order('name')
    if (cs.data) setCompanies(cs.data)
    const ps = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (ps.data) setProfiles(ps.data)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const profName = (uid) => {
    const p = profiles.find((x) => x.id === uid)
    return p ? (p.full_name || p.email) : '—'
  }

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
  if (!contact) return (
    <>
      <span className="backlink" onClick={() => router.push('/stammdaten/kontakte')}><i className="ti ti-arrow-left" /> Zurück</span>
      <p className="sub">Kontakt nicht gefunden.</p>
    </>
  )

  const fullName = [contact.salutation, contact.title, contact.first_name, contact.last_name].filter(Boolean).join(' ')
  const initials = ((contact.first_name || '')[0] || '') + ((contact.last_name || '')[0] || '')
  const fmt = (d) => new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Link href="/stammdaten/kontakte" className="backlink"><i className="ti ti-arrow-left" /> Kontakte</Link>

      <div className="detail-head">
        <div className="avatar-lg">{(initials || 'K').toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h1>{fullName}</h1>
          <div style={{ marginTop: 4 }}>
            {(contact.roles || []).map((r) => <span key={r} className="badge">{roleLabel[r] || r}</span>)}
            {contact.company && <span className="sub" style={{ marginLeft: 6 }}>· {contact.company.name}</span>}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setEditContact(true)}><i className="ti ti-edit" /> Bearbeiten</button>
      </div>

      <div className="detail-grid">
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <h2>Kontaktdaten</h2>
            <div className="info-row"><span className="k">E-Mail</span><span className="v">{contact.email || '—'}</span></div>
            {contact.email_secondary && <div className="info-row"><span className="k">E-Mail 2</span><span className="v">{contact.email_secondary}</span></div>}
            <div className="info-row"><span className="k">Festnetz</span><span className="v">{contact.phone || '—'}</span></div>
            <div className="info-row"><span className="k">Mobil</span><span className="v">{contact.phone_mobile || '—'}</span></div>
            <div className="info-row"><span className="k">Adresse</span><span className="v">{[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' '), contact.region].filter(Boolean).join(', ') || '—'}</span></div>
            <div className="info-row"><span className="k">Zuständig</span><span className="v">{contact.assigned_to ? profName(contact.assigned_to) : '—'}</span></div>
          </div>

          <div className="card">
            <h2>DSGVO</h2>
            <div className="info-row"><span className="k">Einwilligung</span><span className="v">{contact.consent_status}</span></div>
            <div className="info-row"><span className="k">am</span><span className="v">{contact.consent_date || '—'}</span></div>
            <div className="info-row"><span className="k">Quelle</span><span className="v">{contact.data_source || '—'}</span></div>
            <div className="info-row"><span className="k">Marketing</span><span className="v">{contact.marketing_opt_in ? 'erlaubt' : 'nein'}</span></div>
          </div>

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

      {editContact && (
        <ContactForm initial={contact} companies={companies} profiles={profiles}
          onClose={() => setEditContact(false)} onSaved={() => { setEditContact(false); load() }} />
      )}
      {actModal && (
        <ActivityForm initial={editAct} contactId={contact.id}
          onClose={() => setActModal(false)} onSaved={() => { setActModal(false); load() }} />
      )}
    </>
  )
}
