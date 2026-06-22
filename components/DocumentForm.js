'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DOC_CATEGORIES, DOC_STATUS, docCategoryLabel, docStatusLabel } from '@/lib/dms'

export default function DocumentForm({ initial, contacts, companies, onClose, onSaved }) {
  const [f, setF] = useState({
    title: (initial && initial.title) || '',
    description: (initial && initial.description) || '',
    category: (initial && initial.category) || 'sonstige',
    status: (initial && initial.status) || 'final',
    contact_id: (initial && initial.contact_id) || '',
    company_id: (initial && initial.company_id) || '',
    document_date: (initial && initial.document_date) || '',
    expires_at: (initial && initial.expires_at) || ''
  })
  const [tagsText, setTagsText] = useState(
    initial && initial.tags ? initial.tags.join(', ') : ''
  )
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }))

  async function syncTags(docId) {
    const names = tagsText.split(',').map((t) => t.trim()).filter(Boolean)
    const ids = []
    for (const name of names) {
      const { data: ex } = await supabase.from('tags').select('id').eq('name', name).maybeSingle()
      let tagId = ex ? ex.id : null
      if (!tagId) {
        const { data: ins, error } = await supabase.from('tags').insert({ name }).select('id').single()
        if (error) continue
        tagId = ins.id
      }
      ids.push(tagId)
    }
    await supabase.from('document_tags').delete().eq('document_id', docId)
    if (ids.length) await supabase.from('document_tags').insert(ids.map((t) => ({ document_id: docId, tag_id: t })))
  }

  async function save(e) {
    e.preventDefault()
    if (!supabase) { setErr('Supabase nicht verbunden.'); return }
    if (!f.title.trim()) { setErr('Titel ist Pflicht.'); return }
    setBusy(true); setErr(null)
    const payload = {
      ...f,
      contact_id: f.contact_id || null,
      company_id: f.company_id || null,
      document_date: f.document_date || null,
      expires_at: f.expires_at || null
    }
    const { error } = await supabase.from('documents').update(payload).eq('id', initial.id)
    if (error) { setErr(error.message); setBusy(false); return }
    await syncTags(initial.id)
    await supabase.from('document_audit').insert({ document_id: initial.id, action: 'update', detail: 'Metadaten geändert' })
    setBusy(false); onSaved()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>Dokument bearbeiten</h3>
        <div className="field"><label>Titel *</label>
          <input value={f.title} onChange={(e) => up('title', e.target.value)} />
        </div>
        <div className="field"><label>Beschreibung</label>
          <input value={f.description} onChange={(e) => up('description', e.target.value)} />
        </div>
        <div className="field2">
          <div className="field"><label>Kategorie</label>
            <select value={f.category} onChange={(e) => up('category', e.target.value)}>
              {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{docCategoryLabel[c]}</option>)}
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select value={f.status} onChange={(e) => up('status', e.target.value)}>
              {DOC_STATUS.map((s) => <option key={s} value={s}>{docStatusLabel[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="field2">
          <div className="field"><label>Kontakt</label>
            <select value={f.contact_id} onChange={(e) => up('contact_id', e.target.value)}>
              <option value="">— keiner —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ')}</option>)}
            </select>
          </div>
          <div className="field"><label>Firma</label>
            <select value={f.company_id} onChange={(e) => up('company_id', e.target.value)}>
              <option value="">— keine —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field2">
          <div className="field"><label>Dokumentdatum</label>
            <input type="date" value={f.document_date || ''} onChange={(e) => up('document_date', e.target.value)} />
          </div>
          <div className="field"><label>Gültig bis (Ablauf)</label>
            <input type="date" value={f.expires_at || ''} onChange={(e) => up('expires_at', e.target.value)} />
          </div>
        </div>
        <div className="field"><label>Tags (Komma-getrennt)</label>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="z.B. VIP, Mainz, dringend" />
        </div>
        {err && <p className="err">{err}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Speichern…' : 'Speichern'}</button>
        </div>
      </form>
    </div>
  )
}
