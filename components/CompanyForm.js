'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { companyTypeLabel } from '@/lib/sampleData'

const TYPES = ['dienstleister', 'notariat', 'bank', 'bautraeger', 'investor', 'verwaltung', 'sonstige']
const emailOk = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function CompanyForm({ initial, profiles = [], onClose, onSaved }) {
  const [f, setF] = useState({
    name: g(initial, 'name'), company_type: g(initial, 'company_type') || 'sonstige',
    phone: g(initial, 'phone'), email: g(initial, 'email'), website: g(initial, 'website'),
    street: g(initial, 'street'), postal_code: g(initial, 'postal_code'),
    city: g(initial, 'city'), region: g(initial, 'region') || 'Rheinhessen',
    vat_id: g(initial, 'vat_id'), notes: g(initial, 'notes'), assigned_to: g(initial, 'assigned_to')
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function validate() {
    const e = {}
    if (!f.name.trim()) e.name = 'Name ist Pflicht.'
    if (!emailOk(f.email)) e.email = 'Ungültige E-Mail.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save(e) {
    e.preventDefault()
    if (!supabase) { setErr('Supabase nicht verbunden — bitte einloggen.'); return }
    if (!validate()) return
    setBusy(true); setErr(null)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...f, assigned_to: f.assigned_to || null }
    if (initial) {
      const { error } = await supabase.from('companies').update(payload).eq('id', initial.id)
      if (error) { setErr(error.message); setBusy(false); return }
    } else {
      const { error } = await supabase.from('companies').insert({ ...payload, created_by: user ? user.id : null })
      if (error) { setErr(error.message); setBusy(false); return }
    }
    setBusy(false); onSaved()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-form" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <div className="ic"><i className="ti ti-building-plus" /></div>
          <div>
            <h3>{initial ? 'Firma bearbeiten' : 'Neue Firma'}</h3>
            <div className="sub">Organisation der Stammdaten anlegen</div>
          </div>
          <button type="button" className="x" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div className="modal-body">
          <div className="section">
            <div className="section-title"><i className="ti ti-building" /> Firma</div>
            <div className="field"><label>Name <span className="req">*</span></label>
              <input className={errors.name ? 'invalid' : ''} value={f.name} onChange={(e) => up('name', e.target.value)} />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="field"><label>Typ</label>
              <select value={f.company_type} onChange={(e) => up('company_type', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{companyTypeLabel[t]}</option>)}
              </select>
            </div>
          </div>

          <div className="section">
            <div className="section-title"><i className="ti ti-mail" /> Kommunikation</div>
            <div className="field2">
              <div className="field"><label>Telefon</label>
                <input value={f.phone} onChange={(e) => up('phone', e.target.value)} />
              </div>
              <div className="field"><label>E-Mail</label>
                <input className={errors.email ? 'invalid' : ''} type="email" value={f.email} onChange={(e) => up('email', e.target.value)} />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
            </div>
            <div className="field"><label>Website</label>
              <input value={f.website} onChange={(e) => up('website', e.target.value)} placeholder="https://" />
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
            <div className="section-title"><i className="ti ti-info-circle" /> Sonstiges</div>
            <div className="field2">
              <div className="field"><label>USt-IdNr.</label>
                <input value={f.vat_id} onChange={(e) => up('vat_id', e.target.value)} />
              </div>
              <div className="field"><label>Zuständige(r)</label>
                <select value={f.assigned_to} onChange={(e) => up('assigned_to', e.target.value)}>
                  <option value="">— niemand —</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Notizen</label>
              <textarea value={f.notes} onChange={(e) => up('notes', e.target.value)} />
            </div>
          </div>

          {err && <p className="err">{err}</p>}
        </div>

        <div className="modal-foot">
          <div className="spacer" />
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Speichern…' : (initial ? 'Speichern' : 'Firma anlegen')}</button>
        </div>
      </form>
    </div>
  )
}

function g(o, k) { return o && o[k] != null ? o[k] : '' }
