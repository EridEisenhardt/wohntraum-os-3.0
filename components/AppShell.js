'use client'
import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import Sidebar from './Sidebar'

export default function AppShell({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [role, setRole] = useState(null)
  const [perms, setPerms] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !session) { setRole(null); setPerms(null); return }
    let cancelled = false
    ;(async () => {
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      const r = prof ? prof.role : null
      if (cancelled) return
      setRole(r)
      if (r === 'admin' || !r) { setPerms(null); return }
      const { data: pr } = await supabase.from('app_permissions').select('*').eq('role', r)
      if (cancelled) return
      const map = {}
      ;(pr || []).forEach((p) => { map[p.modul] = p })
      setPerms(map)
    })()
    return () => { cancelled = true }
  }, [session])

  if (!ready) return <div className="loading-wrap">Lädt…</div>

  if (supabaseConfigured && !session) return <LoginScreen />

  const user = session ? session.user : null
  return (
    <div className="app">
      <Sidebar user={user} demo={!supabaseConfigured} onLogout={() => supabase.auth.signOut()} role={role} perms={perms} />
      <main className="main">{children}</main>
    </div>
  )
}

function LoginScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(null); setMsg(null)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErr(error.message)
      else setMsg('Konto angelegt. Falls E-Mail-Bestätigung aktiv ist, bitte Postfach prüfen, dann einloggen.')
    }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="logo">W</div>
        <h2>Wohntraum Rheinhessen OS</h2>
        <div className="sub">{mode === 'login' ? 'Bitte anmelden' : 'Konto anlegen'}</div>
        <div className="field"><label>E-Mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field"><label>Passwort</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <p className="err">{err}</p>}
        {msg && <p className="sub" style={{ color: 'var(--brand)' }}>{msg}</p>}
        <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={busy}>
          {busy ? 'Bitte warten…' : (mode === 'login' ? 'Anmelden' : 'Registrieren')}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? 'Noch kein Konto? ' : 'Schon registriert? '}
          <button type="button" className="linkbtn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(null); setMsg(null) }}>
            {mode === 'login' ? 'Registrieren' : 'Zum Login'}
          </button>
        </p>
      </form>
    </div>
  )
}
