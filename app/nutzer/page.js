'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { appRoleLabel, appRoleDesc, APP_ROLES, PERM_LEVELS } from '@/lib/roles'
import { permNodes } from '@/components/Sidebar'

export default function NutzerPage() {
  const [rows, setRows] = useState([])
  const [meId, setMeId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const [selRole, setSelRole] = useState('backoffice')
  const [permMap, setPermMap] = useState({})
  const [permBusy, setPermBusy] = useState(false)

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

  const loadPerms = useCallback(async (role) => {
    if (!supabaseConfigured) return
    const { data } = await supabase.from('app_permissions').select('*').eq('role', role)
    const m = {}
    ;(data || []).forEach((p) => { m[p.modul] = p })
    setPermMap(m)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadPerms(selRole) }, [selRole, loadPerms])

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

  async function togglePerm(modul, level) {
    if (!isAdmin || selRole === 'admin') return
    const cur = permMap[modul] || { role: selRole, modul, sehen: false, lesen: false, schreiben: false, bearbeiten: false, loeschen: false }
    const next = { ...cur, [level]: !cur[level] }
    // Abhängigkeiten: höhere Rechte setzen Sehen/Lesen voraus
    if (next[level]) {
      if (level !== 'sehen') next.sehen = true
      if (['schreiben', 'bearbeiten', 'loeschen'].includes(level)) next.lesen = true
    }
    if (level === 'sehen' && !next.sehen) { next.lesen = next.schreiben = next.bearbeiten = next.loeschen = false }
    if (level === 'lesen' && !next.lesen) { next.schreiben = next.bearbeiten = next.loeschen = false }
    setPermMap((m) => ({ ...m, [modul]: next }))
    setPermBusy(true)
    const { error } = await supabase.from('app_permissions').upsert(next, { onConflict: 'role,modul' })
    setPermBusy(false)
    if (error) { setMsg('Fehler beim Speichern: ' + error.message); loadPerms(selRole) }
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

      {!isAdmin && <p className="sub" style={{ marginBottom: 12 }}>Nur Admins können Rollen, Status und Rechte ändern.</p>}
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
                  <select value={p.role} onChange={(e) => changeRole(p, e.target.value)} style={{ maxWidth: 220 }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Rechte je Rolle</h2>
          <select value={selRole} onChange={(e) => setSelRole(e.target.value)} style={{ maxWidth: 240 }}>
            {APP_ROLES.map((r) => <option key={r} value={r}>{appRoleLabel[r]}</option>)}
          </select>
          {permBusy && <span className="sub">speichert…</span>}
        </div>
        <p className="sub" style={{ marginTop: 0 }}>{appRoleDesc[selRole]}</p>

        {selRole === 'admin' ? (
          <p className="sub">Die Geschäftsführung (Admin) hat immer Vollzugriff auf alle Module. Diese Rolle ist nicht einschränkbar.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Kategorie / Unterkategorie</th>
                  {PERM_LEVELS.map((l) => <th key={l.key} style={{ textAlign: 'center' }}>{l.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {permNodes().map((m) => {
                  const p = permMap[m.key] || {}
                  const isSub = m.level === 1
                  return (
                    <tr key={m.key}>
                      <td style={{ paddingLeft: isSub ? 26 : undefined }}>
                        {isSub ? <span style={{ color: 'var(--muted)', marginRight: 6 }}>↳</span> : null}
                        <b style={{ fontWeight: isSub ? 500 : 700 }}>{m.label}</b>
                        {m.adminOnly ? <span className="badge" style={{ marginLeft: 6 }}>nur Admin</span> : null}
                      </td>
                      {PERM_LEVELS.map((l) => (
                        <td key={l.key} style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={!!p[l.key]} disabled={!isAdmin || m.adminOnly}
                            onChange={() => togglePerm(m.key, l.key)}
                            style={{ width: 17, height: 17, cursor: (isAdmin && !m.adminOnly) ? 'pointer' : 'default', opacity: m.adminOnly ? 0.4 : 1 }} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="sub" style={{ fontSize: 11.5, marginBottom: 0 }}>
          Höhere Rechte setzen niedrigere voraus (Bearbeiten/Löschen erfordert Lesen; alles erfordert Sehen). „Sehen" steuert, ob das Modul in der Seitenleiste erscheint.
        </p>
      </div>

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
