'use client'
import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'

export default function KontoPage() {
  const [email, setEmail] = useState(null)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getUser().then(({ data }) => setEmail(data.user ? data.user.email : null))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (pw1.length < 8) { setErr('Bitte mindestens 8 Zeichen verwenden.'); return }
    if (pw1 !== pw2) { setErr('Die beiden Passwörter stimmen nicht überein.'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    setBusy(false)
    if (error) { setErr('Fehler: ' + error.message); return }
    setPw1(''); setPw2('')
    setMsg('Passwort erfolgreich geändert. Beim nächsten Login gilt das neue Passwort.')
  }

  if (!supabaseConfigured) return <p className="sub">Bitte Supabase verbinden und einloggen.</p>

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Mein Konto</h1>
          <div className="sub">{email || '—'}</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 460 }}>
        <h2 style={{ marginTop: 0 }}>Passwort ändern</h2>
        <p className="sub" style={{ marginTop: 0 }}>Du bist angemeldet — hier kannst du dein Passwort direkt neu setzen, ohne E-Mail-Link.</p>
        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Neues Passwort</label>
            <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" required
              style={{ width: '100%' }} />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Neues Passwort wiederholen</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required
              style={{ width: '100%' }} />
          </div>
          {err && <p className="err">{err}</p>}
          {msg && <p className="sub" style={{ color: 'var(--brand)' }}>{msg}</p>}
          <button type="submit" className="btn" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? 'Bitte warten…' : 'Passwort ändern'}
          </button>
        </form>
      </div>
    </>
  )
}
