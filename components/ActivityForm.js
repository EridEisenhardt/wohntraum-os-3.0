'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ACTIVITY_TYPES, activityTypeLabel, toLocalInput } from '@/lib/activities'

export default function ActivityForm({ initial, contactId, onClose, onSaved }) {
  const [f, setF] = useState({
    type: (initial && initial.type) || 'notiz',
    subject: (initial && initial.subject) || '',
    body: (initial && initial.body) || '',
    occurred_at: toLocalInput(initial && initial.occurred_at),
    due_at: initial && initial.due_at ? toLocalInput(initial.due_at) : '',
    is_done: initial ? !!initial.is_done : false
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function save(e) {
    e.preventDefault()
    if (!supabase) { setErr('Bitte einloggen.'); return }
    setBusy(true); setErr(null)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      contact_id: contactId,
      type: f.type,
      subject: f.subject || null,
      body: f.body || null,
      occurred_at: new Date(f.occurred_at).toISOString(),
      due_at: f.type === 'aufgabe' && f.due_at ? new Date(f.due_at).toISOString() : null,
      is_done: f.type === 'aufgabe' ? f.is_done : false
    }
    if (initial) {
      const { error } = await supabase.from('activities').update(payload).eq('id', initial.id)
      if (error) { setErr(error.message); setBusy(false); return }
    } else {
      const { error } = await supabase.from('activities').insert({ ...payload, created_by: user ? user.id : null })
      if (error) { setErr(error.message); setBusy(false); return }
    }
    setBusy(false); onSaved()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-form" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="modal-head">
          <div className="ic"><i className="ti ti-plus" /></div>
          <div>
            <h3>{initial ? 'Aktivität bearbeiten' : 'Neue Aktivität'}</h3>
            <div className="sub">Interaktion festhalten</div>
          </div>
          <button type="button" className="x" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
          <div className="field2">
            <div className="field"><label>Art</label>
              <select value={f.type} onChange={(e) => up('type', e.target.value)}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{activityTypeLabel[t]}</option>)}
              </select>
            </div>
            <div className="field"><label>Zeitpunkt</label>
              <input type="datetime-local" value={f.occurred_at} onChange={(e) => up('occurred_at', e.target.value)} />
            </div>
          </div>
          <div className="field"><label>Betreff</label>
            <input value={f.subject} onChange={(e) => up('subject', e.target.value)} placeholder="kurze Überschrift" />
          </div>
          <div className="field"><label>Notiz / Details</label>
            <textarea value={f.body} onChange={(e) => up('body', e.target.value)} />
          </div>
          {f.type === 'aufgabe' && (
            <div className="field2">
              <div className="field"><label>Fällig am</label>
                <input type="datetime-local" value={f.due_at} onChange={(e) => up('due_at', e.target.value)} />
              </div>
              <div className="field"><label>Status</label>
                <label className="chip" style={{ display: 'inline-flex', marginTop: 2 }}>
                  <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={f.is_done} onChange={(e) => up('is_done', e.target.checked)} />
                  erledigt
                </label>
              </div>
            </div>
          )}
          {err && <p className="err">{err}</p>}
        </div>
        <div className="modal-foot">
          <div className="spacer" />
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Speichern…' : 'Speichern'}</button>
        </div>
      </form>
    </div>
  )
}
