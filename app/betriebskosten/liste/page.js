'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import { STATUS, statusOf, fmtDate } from '@/lib/bk'

export default function BetriebskostenPage() {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [gebaeude, setGebaeude] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [jahr, setJahr] = useState(new Date().getFullYear() - 1)
  const [form, setForm] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    const { data, error } = await supabase.from('bk_abrechnungen').select('*').order('jahr', { ascending: false }).order('kennung')
    if (error) { setError(error.message); setLoading(false); return }
    setError(null); setRows(data || [])
    const [e, m, k] = await Promise.all([
      supabase.from('bk_einheiten').select('abrechnung_id'),
      supabase.from('bk_mietverhaeltnisse').select('abrechnung_id'),
      supabase.from('bk_kosten').select('abrechnung_id, betrag'),
    ])
    const c = {}
    const inc = (id, key, by = 1) => { c[id] = c[id] || { einheiten: 0, mieter: 0, kosten: 0, summe: 0 }; c[id][key] += by }
    ;(e.data || []).forEach((r) => inc(r.abrechnung_id, 'einheiten'))
    ;(m.data || []).forEach((r) => inc(r.abrechnung_id, 'mieter'))
    ;(k.data || []).forEach((r) => { inc(r.abrechnung_id, 'kosten'); inc(r.abrechnung_id, 'summe', Number(r.betrag) || 0) })
    setCounts(c)
    const g = await supabase.from('gebaeude').select('id, kennung, name, eigentuemer, ort, nutzen_lasten').order('kennung')
    if (!g.error) setGebaeude(g.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const jahre = Array.from(new Set([jahr, ...rows.map((r) => r.jahr)])).sort((a, b) => b - a)
  const list = rows.filter((r) => r.jahr === jahr)

  function openNew() {
    setForm({ kennung: '', objekt_name: '', eigentuemer: '', gebaeude_id: '', jahr, zeitraum_von: jahr + '-01-01', zeitraum_bis: jahr + '-12-31' })
  }
  function pickGebaeude(id) {
    const g = gebaeude.find((x) => String(x.id) === id)
    if (!g) { setForm({ ...form, gebaeude_id: '' }); return }
    const nl = g.nutzen_lasten && g.nutzen_lasten.slice(0, 4) === String(form.jahr) ? g.nutzen_lasten.slice(0, 10) : null
    setForm({ ...form, gebaeude_id: String(g.id), kennung: g.kennung || form.kennung, objekt_name: g.name || '', eigentuemer: g.eigentuemer || '',
      zeitraum_von: nl || form.zeitraum_von })
  }
  async function create() {
    if (!form.kennung || !form.jahr) { alert('Bitte Objektkürzel und Jahr angeben.'); return }
    const { data, error } = await supabase.from('bk_abrechnungen').insert({
      kennung: form.kennung.trim(), objekt_name: form.objekt_name || null, eigentuemer: form.eigentuemer || null,
      gebaeude_id: form.gebaeude_id || null, jahr: Number(form.jahr), zeitraum_von: form.zeitraum_von, zeitraum_bis: form.zeitraum_bis,
    }).select().single()
    if (error) { alert('Anlegen fehlgeschlagen: ' + error.message); return }
    window.location.href = '/betriebskosten/' + data.id
  }

  const frist = new Date(jahr + 1, 11, 31)
  const tageBisFrist = Math.ceil((frist - new Date()) / 86400000)

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Betriebskostenabrechnung</h1>
          <div className="sub">Abrechnungsjahr {jahr} · Zugang beim Mieter spätestens {frist.toLocaleDateString('de-DE')}
            {tageBisFrist >= 0 && <> · <b style={{ color: tageBisFrist < 30 ? '#e5484d' : 'inherit' }}>noch {tageBisFrist} Tage</b></>}
          </div>
        </div>
        <div className="actions">
          <select value={jahr} onChange={(e) => setJahr(Number(e.target.value))} style={{ font: 'inherit', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)' }}>
            {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
            <option value={jahr + 1}>{jahr + 1}</option>
          </select>
          <button className="btn" onClick={openNew}><i className="ti ti-plus" /> Neue Abrechnung</button>
        </div>
      </div>

      {error && <p className="err">Supabase: {error}{/relation .* does not exist/.test(error) && ' – die Tabellen für die Betriebskostenabrechnung sind noch nicht eingespielt (docs/sql/2026-10_bk_abrechnung.sql).'}</p>}

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {STATUS.filter((s) => s.v !== 'nicht_abrechnen').map((s) => (
          <div className="kpi" key={s.v}><div className="label">{s.label}</div><div className="val">{list.filter((r) => r.status === s.v).length}</div></div>
        ))}
      </div>

      {loading ? <p>Lade …</p> : list.length === 0 ? (
        <div className="card"><p style={{ margin: 0 }}>Für {jahr} gibt es noch keine Abrechnung. Lege je Objekt eine an – Einheiten, Mieter, Verteilerschlüssel und Kosten trägst du danach in der Abrechnung ein.</p></div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Objekt</th><th>Eigentümer</th><th>Zeitraum</th><th style={{ textAlign: 'right' }}>Einheiten</th><th style={{ textAlign: 'right' }}>Mietverhältnisse</th><th style={{ textAlign: 'right' }}>Kosten erfasst</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((r) => {
              const c = counts[r.id] || {}; const s = statusOf(r.status)
              return (
                <tr key={r.id}>
                  <td><Link href={'/betriebskosten/' + r.id} style={{ color: 'var(--brand)', fontWeight: 600 }}>{r.kennung}</Link> <span style={{ color: 'var(--muted)' }}>{r.objekt_name}</span></td>
                  <td>{r.eigentuemer || '—'}</td>
                  <td>{fmtDate(r.zeitraum_von)} – {fmtDate(r.zeitraum_bis)}</td>
                  <td style={{ textAlign: 'right' }}>{c.einheiten || 0}</td>
                  <td style={{ textAlign: 'right' }}>{c.mieter || 0}</td>
                  <td style={{ textAlign: 'right' }}>{(c.summe || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })} € <span style={{ color: 'var(--muted)' }}>({c.kosten || 0})</span></td>
                  <td><span className="badge" style={{ background: s.color + '1a', color: s.color }}>{s.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <div className="modal modal-form" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-head"><div className="ic"><i className="ti ti-receipt-2" /></div><div><h3>Neue Abrechnung</h3><div className="sub">Ein Objekt, ein Abrechnungsjahr</div></div><button type="button" className="x" onClick={() => setForm(null)}><i className="ti ti-x" /></button></div>
            <div className="modal-body">
              {gebaeude.length > 0 && (
                <div className="field"><label>Objekt aus „Input Portfolio“ übernehmen
                  </label><select value={form.gebaeude_id} onChange={(e) => pickGebaeude(e.target.value)}>
                    <option value="">– manuell eingeben –</option>
                    {gebaeude.map((g) => <option key={g.id} value={g.id}>{(g.kennung ? g.kennung + ' · ' : '') + (g.name || '')}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                <div className="field"><label>Kürzel</label><input value={form.kennung} onChange={(e) => setForm({ ...form, kennung: e.target.value })} placeholder="A14" /></div>
                <div className="field"><label>Objekt</label><input value={form.objekt_name} onChange={(e) => setForm({ ...form, objekt_name: e.target.value })} placeholder="Abtweilerstraße 14, Lauschied" /></div>
              </div>
              <div className="field"><label>Eigentümer</label><input value={form.eigentuemer} onChange={(e) => setForm({ ...form, eigentuemer: e.target.value })} placeholder="Wohntraum Rheinhessen GmbH" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 10 }}>
                <div className="field"><label>Jahr</label><input value={form.jahr} onChange={(e) => { const j = e.target.value; setForm({ ...form, jahr: j, zeitraum_von: j + '-01-01', zeitraum_bis: j + '-12-31' }) }} /></div>
                <div className="field"><label>Zeitraum von</label><input type="date" value={form.zeitraum_von} onChange={(e) => setForm({ ...form, zeitraum_von: e.target.value })} /></div>
                <div className="field"><label>bis</label><input type="date" value={form.zeitraum_bis} onChange={(e) => setForm({ ...form, zeitraum_bis: e.target.value })} /></div>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>Bei Kauf oder Verkauf im Jahr beginnt bzw. endet der Zeitraum mit dem Übergang von Nutzen und Lasten.</p>
            </div>
            <div className="modal-foot"><div className="spacer" />
              <button className="btn btn-ghost" onClick={() => setForm(null)}>Abbrechen</button>
              <button className="btn" onClick={create}>Anlegen</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
