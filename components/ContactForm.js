'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { roleLabel } from '@/lib/sampleData'

const ALL_ROLES = ['kaeufer', 'verkaeufer', 'mieter', 'partner', 'notar', 'finanzierer']
const emailOk = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function ContactForm({ initial, companies, profiles = [], onClose, onSaved }) {
  const [f, setF] = useState({
    salutation: g(initial, 'salutation'), title: g(initial, 'title'),
    first_name: g(initial, 'first_name'), last_name: g(initial, 'last_name'),
    email: g(initial, 'email'), email_secondary: g(initial, 'email_secondary'),
    phone: g(initial, 'phone'), phone_mobile: g(initial, 'phone_mobile'),
    street: g(initial, 'street'), postal_code: g(initial, 'postal_code'),
    city: g(initial, 'city'), region: g(initial, 'region') || 'Rheinhessen',
    company_id: g(initial, 'company_id'), position: g(initial, 'position'),
    assigned_to: g(initial, 'assigned_to'),
    consent_status: g(initial, 'consent_status') || 'ausstehend',
    consent_date: g(initial, 'consent_date'), data_source: g(initial, 'data_source'),
    marketing_opt_in: initial ? !!initial.marketing_opt_in : false
  })
  const [roles, setRoles] = useState((initial && initial.roles) || [])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const toggleRole = (r) => setRoles((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function validate() {
    const e = {}
    if (!f.last_name.trim()) e.last_name = 'Nachname ist Pflicht.'
    if (!emailOk(f.email)) e.email = 'Ungültige E-Mail.'
    if (!emailOk(f.email_secondary)) e.email_secondary = 'Ungültige E-Mail.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save(e) {
    e.preventDefault()
    if (!supabase) { setErr('Supabase nicht verbunden — bitte einloggen.'); return }
    if (!validate()) return
    setBusy(true); setErr(null)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...f,
      company_id: f.company_id || null,
      assigned_to: f.assigned_to || null,
      consent_date: f.consent_date || null
    }
    let contactId = initial && initial.id
    if (initial) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', initial.id)
      if (error) { setErr(error.message); setBusy(false); return }
    } else {
      const { data, error } = await supabase.from('contacts')
        .insert({ ...payload, created_by: user ? user.id : null }).select('id').single()
      if (error) { setErr(error.message); setBusy(false); return }
      contactId = data.id
    }
    await supabase.from('contact_roles').delete().eq('contact_id', contactId)
    if (roles.length) {
      const { error: rerr } = await supabase.from('contact_roles')
        .insert(roles.map((r) => ({ contact_id: contactId, role: r })))
      if (rerr) { setErr(rerr.message); setBusy(false); return }
    }
    setBusy(false); onSaved()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-form" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <div className="ic"><i className="ti ti-user-plus" /></div>
          <div>
            <h3>{initial ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</h3>
            <div className="sub">Person der Stammdaten anlegen</div>
          </div>
          <button type="button" className="x" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div className="modal-body">
          <div className="section">
            <div className="section-title"><i className="ti ti-user" /> Person</div>
            <div className="field-3">
              <div className="field"><label>Anrede</label>
                <select value={f.salutation} onChange={(e) => up('salutation', e.target.value)}>
                  <option value="">—</option><option>Herr</option><option>Frau</option><option>Divers</option>
                </select>
              </div>
              <div className="field"><label>Titel</label>
                <input value={f.title} onChange={(e) => up('title', e.target.value)} placeholder="z.B. Dr." />
              </div>
            </div>
            <div className="field2">
              <div className="field"><label>Vorname</label>
                <input value={f.first_name} onChange={(e) => up('first_name', e.target.value)} />
              </div>
              <div className="field"><label>Nachname <span className="req">*</span></label>
                <input className={errors.last_name ? 'invalid' : ''} value={f.last_name} onChange={(e) => up('last_name', e.target.value)} />
                {errors.last_name && <div className="field-error">{errors.last_name}</div>}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><i className="ti ti-mail" /> Kommunikation</div>
            <div className="field2">
              <div className="field"><label>E-Mail</label>
                <input className={errors.email ? 'invalid' : ''} type="email" value={f.email} onChange={(e) => up('email', e.target.value)} />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
              <div className="field"><label>E-Mail (sekundär)</label>
                <input className={errors.email_secondary ? 'invalid' : ''} type="email" value={f.email_secondary} onChange={(e) => up('email_secondary', e.target.value)} />
                {errors.email_secondary && <div className="field-error">{errors.email_secondary}</div>}
              </div>
            </div>
            <div className="field2">
              <div className="field"><label>Telefon (Festnetz)</label>
                <input value={f.phone} onChange={(e) => up('phone', e.target.value)} />
              </div>
              <div className="field"><label>Telefon (mobil)</label>
                <input value={f.phone_mobile} onChange={(e) => up('phone_mobile', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><i className="ti ti-map-pin" /> Adresse</div>
            <div className="field"><label>Straße &amp; Nr.</label>
              <input value={f.street} onChange={(e) => up('street', e.target.value)} />
            </div>
            <div className="plz-ort">
              <div className="field"><label>PLZ</label>
                <input value={f.postal_code} onChange={(e) => up('postal_code', e.target.value)} />
              </div>
              <div className="field"><label>Ort</label>
                <input value={f.city} onChange={(e) => up('city', e.target.value)} />
              </div>
            </div>
            <div className="field"><label>Region</label>
              <input value={f.region} onChange={(e) => up('region', e.target.value)} />
            </div>
          </div>

          <div className="section">
            <div className="section-title"><i className="ti ti-building" /> Zuordnung</div>
            <div className="field2">
              <div className="field"><label>Firma</label>
                <select value={f.company_id} onChange={(e) => up('company_id', e.target.value)}>
                  <option value="">— keine —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Position</label>
                <input value={f.position} onChange={(e) => up('position', e.target.value)} placeholder="z.B. Geschäftsführer" />
              </div>
            </div>
            <div className="field"><label>Zuständige(r) Mitarbeiter(in)</label>
              <select value={f.assigned_to} onChange={(e) => up('assigned_to', e.target.value)}>
                <option value="">— niemand —</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
            <div className="field"><label>Rolle(n)</label>
              <div className="chips">
                {ALL_ROLES.map((r) => (
                  <div key={r} className={'chip' + (roles.includes(r) ? ' active' : '')} onClick={() => toggleRole(r)}>
                    {roles.includes(r) && <i className="ti ti-check" />}{roleLabel[r]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><i className="ti ti-shield-lock" /> DSGVO</div>
            <div className="field2">
              <div className="field"><label>Einwilligung</label>
                <select value={f.consent_status} onChange={(e) => up('consent_status', e.target.value)}>
                  <option value="ausstehend">ausstehend</option>
                  <option value="erteilt">erteilt</option>
                  <option value="widerrufen">widerrufen</option>
                  <option value="berechtigtes_interesse">berechtigtes Interesse</option>
                </select>
              </div>
              <div className="field"><label>Einwilligung am</label>
                <input type="date" value={f.consent_date || ''} onChange={(e) => up('consent_date', e.target.value)} />
              </div>
            </div>
            <div className="field"><label>Datenquelle</label>
              <input value={f.data_source} onChange={(e) => up('data_source', e.target.value)} placeholder="z.B. Website-Formular, Empfehlung" />
            </div>
            <label className="chip" style={{ display: 'inline-flex' }}>
              <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={f.marketing_opt_in} onChange={(e) => up('marketing_opt_in', e.target.checked)} />
              Newsletter/Marketing erlaubt
            </label>
          </div>

          {err && <p className="err">{err}</p>}
        </div>

        <div className="modal-foot">
          <div className="spacer" />
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Speichern…' : (initial ? 'Speichern' : 'Kontakt anlegen')}</button>
        </div>
      </form>
    </div>
  )
}

function g(o, k) { return o && o[k] != null ? o[k] : '' }
