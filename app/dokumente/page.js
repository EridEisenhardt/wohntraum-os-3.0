'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { docCategoryLabel, docStatusLabel, DOC_CATEGORIES, formatBytes, expiryInfo } from '@/lib/dms'
import DocumentForm from '@/components/DocumentForm'

const BUCKET = 'dokumente'

export default function DokumentePage() {
  const [docs, setDocs] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [msg, setMsg] = useState(null)
  const fileRef = useRef(null)
  const versionRef = useRef(null)
  const [versionTarget, setVersionTarget] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) return
    const { data } = await supabase
      .from('documents')
      .select('*, contact:contacts(first_name,last_name), company:companies(name), document_tags(tag:tags(name))')
      .order('created_at', { ascending: false })
    if (data) setDocs(data.map((d) => ({ ...d, tags: (d.document_tags || []).map((x) => x.tag && x.tag.name).filter(Boolean) })))
    const cs = await supabase.from('contacts').select('id, first_name, last_name').order('last_name')
    if (cs.data) setContacts(cs.data)
    const fs = await supabase.from('companies').select('id, name').order('name')
    if (fs.data) setCompanies(fs.data)
  }, [])

  useEffect(() => { load() }, [load])

  async function uploadFiles(files) {
    if (!supabase) { setMsg('Bitte einloggen, um Dokumente zu speichern.'); return }
    setUploading(true); setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    for (const file of files) {
      const id = crypto.randomUUID()
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = id + '/v1_' + safe
      const up = await supabase.storage.from(BUCKET).upload(path, file)
      if (up.error) { setMsg('Upload-Fehler: ' + up.error.message); continue }
      const { error } = await supabase.from('documents').insert({
        id, title: file.name, storage_path: path, file_name: file.name,
        mime_type: file.type, size_bytes: file.size, current_version: 1,
        created_by: user ? user.id : null
      })
      if (error) { setMsg('DB-Fehler: ' + error.message); continue }
      await supabase.from('document_versions').insert({
        document_id: id, version: 1, storage_path: path, file_name: file.name,
        size_bytes: file.size, mime_type: file.type, uploaded_by: user ? user.id : null
      })
      await supabase.from('document_audit').insert({ document_id: id, action: 'upload', detail: file.name })
    }
    setUploading(false)
    load()
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length) uploadFiles(Array.from(e.dataTransfer.files))
  }

  async function openPreview(d) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 600)
    if (error) { setMsg('Vorschau-Fehler: ' + error.message); return }
    await supabase.from('document_audit').insert({ document_id: d.id, action: 'view', detail: d.title })
    setPreview({ doc: d, url: data.signedUrl })
  }

  async function download(d) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 120, { download: d.file_name || true })
    if (error) { setMsg('Download-Fehler: ' + error.message); return }
    window.open(data.signedUrl, '_blank')
  }

  async function share(d) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 604800)
    if (error) { setMsg('Teilen-Fehler: ' + error.message); return }
    try { await navigator.clipboard.writeText(data.signedUrl) } catch (e) {}
    await supabase.from('document_audit').insert({ document_id: d.id, action: 'share', detail: 'Link 7 Tage gültig' })
    setMsg('Teilen-Link (7 Tage gültig) in die Zwischenablage kopiert.')
  }

  async function remove(d) {
    if (!window.confirm('Dokument "' + d.title + '" wirklich löschen?')) return
    await supabase.storage.from(BUCKET).remove([d.storage_path])
    const { error } = await supabase.from('documents').delete().eq('id', d.id)
    if (error) { setMsg('Löschen fehlgeschlagen: ' + error.message); return }
    await supabase.from('document_audit').insert({ document_id: null, action: 'delete', detail: d.title })
    load()
  }

  function triggerVersion(d) { setVersionTarget(d); setTimeout(() => versionRef.current && versionRef.current.click(), 0) }

  async function onVersionFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file || !versionTarget) return
    const d = versionTarget; setVersionTarget(null)
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const newVer = (d.current_version || 1) + 1
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = d.id + '/v' + newVer + '_' + safe
    const up = await supabase.storage.from(BUCKET).upload(path, file)
    if (up.error) { setMsg('Upload-Fehler: ' + up.error.message); setUploading(false); return }
    await supabase.from('document_versions').insert({
      document_id: d.id, version: newVer, storage_path: path, file_name: file.name,
      size_bytes: file.size, mime_type: file.type, uploaded_by: user ? user.id : null
    })
    await supabase.from('documents').update({
      storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, current_version: newVer
    }).eq('id', d.id)
    await supabase.from('document_audit').insert({ document_id: d.id, action: 'version', detail: 'Version ' + newVer })
    setUploading(false); load()
  }

  const filtered = docs.filter((d) => {
    if (catFilter && d.category !== catFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    const linked = [d.contact && [d.contact.first_name, d.contact.last_name].filter(Boolean).join(' '), d.company && d.company.name].filter(Boolean).join(' ')
    return (d.title || '').toLowerCase().includes(q) ||
      (docCategoryLabel[d.category] || '').toLowerCase().includes(q) ||
      linked.toLowerCase().includes(q) ||
      (d.tags || []).join(' ').toLowerCase().includes(q)
  })

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Dokumente</h1>
          <div className="sub">{docs.length} Dokumente · DMS</div>
        </div>
        <div className="actions">
          <button className="btn" disabled={uploading} onClick={() => fileRef.current && fileRef.current.click()}>
            <i className="ti ti-upload" /> {uploading ? 'Lädt…' : 'Hochladen'}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
        onChange={(e) => { uploadFiles(Array.from(e.target.files)); e.target.value = '' }} />
      <input ref={versionRef} type="file" style={{ display: 'none' }} onChange={onVersionFile} />

      {!supabaseConfigured && <p className="sub">Bitte Supabase verbinden und einloggen.</p>}
      {msg && <p className="sub" style={{ color: 'var(--brand)' }}>{msg}</p>}

      <div
        className={'dropzone' + (dragOver ? ' over' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current && fileRef.current.click()}
      >
        <i className="ti ti-cloud-upload" style={{ fontSize: 26 }} />
        <div>Dateien hierher ziehen oder klicken zum Auswählen</div>
      </div>

      <div className="toolbar">
        <div className="search" style={{ flex: 1 }}>
          <i className="ti ti-search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suche Titel, Kategorie, Verknüpfung, Tag…"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Alle Kategorien</option>
          {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{docCategoryLabel[c]}</option>)}
        </select>
      </div>

      <table className="tbl">
        <thead>
          <tr><th>Titel</th><th>Kategorie</th><th>Status</th><th>Verknüpfung</th><th>Ablauf</th><th>Größe</th><th /></tr>
        </thead>
        <tbody>
          {filtered.map((d) => {
            const exp = expiryInfo(d.expires_at)
            const linked = d.contact ? [d.contact.first_name, d.contact.last_name].filter(Boolean).join(' ') : (d.company ? d.company.name : '—')
            return (
              <tr key={d.id}>
                <td>
                  {d.title}{d.current_version > 1 ? <span className="badge" style={{ marginLeft: 6 }}>v{d.current_version}</span> : null}
                  {(d.tags || []).map((t) => <span key={t} className="badge" style={{ marginLeft: 4 }}>{t}</span>)}
                </td>
                <td><span className="badge">{docCategoryLabel[d.category] || d.category}</span></td>
                <td>{docStatusLabel[d.status] || d.status}</td>
                <td>{linked}</td>
                <td>{exp ? <span className={'pill ' + (exp.kind === 'expired' ? 'demo' : exp.kind === 'soon' ? 'demo' : 'live')}>{exp.label}</span> : '—'}</td>
                <td>{formatBytes(d.size_bytes)}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="iconbtn" title="Vorschau" onClick={() => openPreview(d)}><i className="ti ti-eye" /></button>
                  <button className="iconbtn" title="Download" onClick={() => download(d)}><i className="ti ti-download" /></button>
                  <button className="iconbtn" title="Teilen-Link" onClick={() => share(d)}><i className="ti ti-share" /></button>
                  <button className="iconbtn" title="Neue Version" onClick={() => triggerVersion(d)}><i className="ti ti-versions" /></button>
                  <button className="iconbtn" title="Bearbeiten" onClick={() => setEditing(d)}><i className="ti ti-edit" /></button>
                  <button className="iconbtn" title="Löschen" onClick={() => remove(d)}><i className="ti ti-trash" /></button>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>Noch keine Dokumente.</td></tr>
          )}
        </tbody>
      </table>

      {editing && (
        <DocumentForm initial={editing} contacts={contacts} companies={companies}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
      )}

      {preview && (
        <div className="overlay" onClick={() => setPreview(null)}>
          <div className="modal" style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center' }}>
              {preview.doc.title}
              <button className="logoutbtn" onClick={() => setPreview(null)}><i className="ti ti-x" /></button>
            </h3>
            {(preview.doc.mime_type || '').startsWith('image/')
              ? <img src={preview.url} alt={preview.doc.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
              : <iframe src={preview.url} title="Vorschau" style={{ width: '100%', height: 520, border: '1px solid var(--line)', borderRadius: 8 }} />}
          </div>
        </div>
      )}
    </>
  )
}
