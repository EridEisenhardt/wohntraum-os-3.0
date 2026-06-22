'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { appRoleLabel, appRoleDesc, APP_ROLES } from '@/lib/roles'

export default function NutzerPage() {
  const [rows, setRows] = useState([])
  const [meId, setMeId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    setMeId(user ? user.id : null)
    const { data } = await supabase.from('profiles')
      .select('id, full_name, email, role, is_active, created_at')
      .order('created_at', { ascending: true })
    if (data) {
      setRows(data)
      const me = data.find((p) => user && p.id === user.id)
      setIsAdmin(me ? me.role === 'admin' : false)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function changeRole(p, role) {
    if (role === p.role) return
    if (p.id === meId && p.role === 'admin' && role !== 'admin') {
      if (!window.confirm('Du entziehst dir selbst die Admin-Rechte. Fortfahren?')) return
    }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id)
    if (error) { setMsg('Fehler: ' + error.message); return }
    setMsg('Rolle von ' + (p.full_name || p.email) + ' auf ' + appRoleLabel[role] + ' gesetzt.')
    load()
  }

  async function toggleActive(p) {
    const { error } = await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id)
    if (error) { setMsg('Fehler: ' + error.message); return }
    load()
  }

  if (!supabaseConfigured) return <p className="sub">Bitte Supabase verbinden und einloggen.</p>
  if (loading) return <p className="sub">Lädt…</p>

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Nutzerverwaltung</h1>
          <div className="sub">{rows.length} Nutzer · Rollen &amp; Rechte</div>
        </div>
        <div className="actions">
          <span className={'pill ' + (isAdmin ? 'live' : 'demo')}>{isAdmin ? 'Admin' : 'nur Ansicht'}</span>
        </div>
      </div>

      {!isAdmin && <p className="sub" style={{ marginBottom: 12 }}>Nur Admins können Rollen und Status ändern.</p>}
      {msg && <p className="sub" style={{ color: 'var(--brand)' }}>{msg}</p>}

      <table className="tbl">
        <thead>
          <tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.full_name || '—'}{p.id === meId && <span className="badge" style={{ marginLeft: 6 }}>du</span>}</td>
              <td>{p.email}</td>
              <td>
                {isAdmin ? (
                  <select value={p.role} onChange={(e) => changeRole(p, e.target.value)} style={{ maxWidth: 170 }}
                    title={appRoleDesc[p.role]}>
                    {APP_ROLES.map((r) => <option key={r} value={r}>{appRoleLabel[r]}</option>)}
                  </select>
                ) : (
                  <span className="badge" title={appRoleDesc[p.role]}>{appRoleLabel[p.role] || p.role}</span>
                )}
              </td>
              <td>
                {isAdmin ? (
                  <button className="btn-ghost" onClick={() => toggleActive(p)}>
                    <i className={'ti ' + (p.is_active ? 'ti-user-check' : 'ti-user-off')} /> {p.is_active ? 'Aktiv' : 'Inaktiv'}
                  </button>
                ) : (
                  <span className={'pill ' + (p.is_active ? 'live' : 'demo')}>{p.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Neue Nutzer hinzufügen</h2>
        <p className="sub" style={{ margin: 0 }}>
          Neue Teammitglieder registrieren sich über den Login-Bildschirm („Registrieren").
          Sobald sie erscheinen, kannst du ihnen hier eine Rolle zuweisen.
          Alternativ in Supabase unter Authentication → Users anlegen (mit „Auto Confirm").
        </p>
      </div>
    </>
  )
}
