'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabaseClient'
import Cell from '@/components/bk/Cell'
import {
  SCHLUESSEL, schluesselLabel, AUSNAHME_ARTEN, ausnahmeLabel, MV_ARTEN, KATEGORIEN, STATUS, statusOf,
  STANDARD_KOSTENARTEN, eur, num, fmtDate, tage, luecken, ueberschneidungen, anteileVorschau,
} from '@/lib/bk'

const TABS = [
  { v: 'einheiten', label: 'Einheiten & Mieter', icon: 'ti-home' },
  { v: 'schluessel', label: 'Verteilerschlüssel', icon: 'ti-arrows-split' },
  { v: 'kosten', label: 'Kosten', icon: 'ti-receipt' },
  { v: 'pruefung', label: 'Prüfung', icon: 'ti-checklist' },
]

export default function AbrechnungPage({ params }) {
  const id = params.id
  const [tab, setTab] = useState('einheiten')
  const [abr, setAbr] = useState(null)
  const [ein, setEin] = useState([])
  const [mvs, setMvs] = useState([])
  const [kas, setKas] = useState([])
  const [aus, setAus] = useState([])
  const [kosten, setKosten] = useState([])
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) return
    const a = await supabase.from('bk_abrechnungen').select('*').eq('id', id).single()
    if (a.error) { setError(a.error.message); return }
    setAbr(a.data)
    const [e, m, k, k2] = await Promise.all([
      supabase.from('bk_einheiten').select('*').eq('abrechnung_id', id).order('pos').order('bezeichnung'),
      supabase.from('bk_mietverhaeltnisse').select('*').eq('abrechnung_id', id).order('von'),
      supabase.from('bk_kostenarten').select('*').eq('abrechnung_id', id).order('pos').order('name'),
      supabase.from('bk_kosten').select('*').eq('abrechnung_id', id).order('datum'),
    ])
    setEin(e.data || []); setMvs(m.data || []); setKas(k.data || []); setKosten(k2.data || [])
    const kaIds = (k.data || []).map((x) => x.id)
    if (kaIds.length) {
      const x = await supabase.from('bk_ausnahmen').select('*').in('kostenart_id', kaIds)
      setAus(x.data || [])
    } else setAus([])
    const err = [e, m, k, k2].find((r) => r.error); setError(err ? err.error.message : null)
  }, [id])
  useEffect(() => { load() }, [load])

  // generische Update-/Insert-/Delete-Helfer
  const upd = (table, setter) => async (rowId, field, value) => {
    const { error } = await supabase.from(table).update({ [field]: value }).eq('id', rowId)
    if (error) { alert('Speichern fehlgeschlagen: ' + error.message); return false }
    setter((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)))
    return true
  }
  const updAbr = async (field, value) => {
    const { error } = await supabase.from('bk_abrechnungen').update({ [field]: value }).eq('id', id)
    if (error) { alert(error.message); return false }
    setAbr((p) => ({ ...p, [field]: value })); return true
  }
  async function del(table, rowId, text) {
    if (text && !window.confirm(text)) return
    const { error } = await supabase.from(table).delete().eq('id', rowId)
    if (error) { alert('Löschen fehlgeschlagen: ' + error.message); return }
    load()
  }
  async function ins(table, row) {
    const { error } = await supabase.from(table).insert(row)
    if (error) { alert('Anlegen fehlgeschlagen: ' + error.message); return }
    load()
  }

  if (!supabaseConfigured) return <p>Supabase ist nicht konfiguriert.</p>
  if (error && !abr) return <p className="err">Supabase: {error}</p>
  if (!abr) return <p>Lade …</p>

  const s = statusOf(abr.status)
  const flaecheSumme = ein.reduce((x, e) => x + (Number(e.flaeche) || 0), 0)

  return (
    <>
      <div className="pagehead">
        <div>
          <Link href="/betriebskosten" className="backlink"><i className="ti ti-arrow-left" /> Alle Abrechnungen</Link>
          <h1>{abr.kennung} · Betriebskosten {abr.jahr}</h1>
          <div className="sub">{abr.objekt_name || ''}{abr.eigentuemer ? ' · ' + abr.eigentuemer : ''} · Zeitraum {fmtDate(abr.zeitraum_von)} – {fmtDate(abr.zeitraum_bis)} ({tage(abr.zeitraum_von, abr.zeitraum_bis)} Tage)</div>
        </div>
        <div className="actions">
          <select value={abr.status} onChange={(e) => updAbr('status', e.target.value)}
            style={{ font: 'inherit', fontSize: 13.5, padding: '7px 10px', borderRadius: 8, border: '1px solid ' + s.color, color: s.color, fontWeight: 600, background: 'var(--surface)' }}>
            {STATUS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="err">Supabase: {error}</p>}

      <div className="kpis">
        <div className="kpi"><div className="label">Einheiten · Fläche</div><div className="val">{ein.length} <span style={{ fontSize: 15, color: 'var(--muted)' }}>· {num(flaecheSumme, 2)} m²</span></div></div>
        <div className="kpi"><div className="label">Mietverhältnisse</div><div className="val">{mvs.length}</div></div>
        <div className="kpi"><div className="label">Kostenarten</div><div className="val">{kas.length}</div></div>
        <div className="kpi"><div className="label">Kosten erfasst</div><div className="val" style={{ fontSize: 22 }}>{eur(kosten.reduce((x, k) => x + (Number(k.betrag) || 0), 0))}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.v} className={'chip' + (tab === t.v ? ' active' : '')} onClick={() => setTab(t.v)}><i className={'ti ' + t.icon} /> {t.label}</button>
        ))}
      </div>

      {tab === 'einheiten' && <EinheitenTab {...{ abr, ein, mvs, upd, ins, del, setEin, setMvs, updAbr }} />}
      {tab === 'schluessel' && <SchluesselTab {...{ abr, ein, mvs, kas, aus, upd, ins, del, setKas, setAus, load }} />}
      {tab === 'kosten' && <KostenTab {...{ abr, kas, mvs, kosten, upd, ins, del, setKosten }} />}
      {tab === 'pruefung' && <PruefungTab {...{ abr, ein, mvs, kas, kosten }} />}
    </>
  )
}

/* ---------------- Einheiten & Mieter ---------------- */
function EinheitenTab({ abr, ein, mvs, upd, ins, del, setEin, setMvs, updAbr }) {
  const uE = upd('bk_einheiten', setEin)
  const uM = upd('bk_mietverhaeltnisse', setMvs)
  const einOpts = ein.map((e) => ({ v: e.id, label: e.bezeichnung }))
  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ display: 'flex', alignItems: 'center' }}>Einheiten im Jahr {abr.jahr}
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => ins('bk_einheiten', { abrechnung_id: abr.id, bezeichnung: 'WE ' + (ein.length + 1), pos: ein.length })}><i className="ti ti-plus" /> Einheit</button>
        </h2>
        <p style={{ marginTop: -6, fontSize: 12.5, color: 'var(--muted)' }}>Stand im Abrechnungsjahr (nicht der heutige). Fläche laut Mietvertrag.</p>
        <table className="tbl">
          <thead><tr><th>Bezeichnung</th><th>Kategorie</th><th style={{ textAlign: 'right' }}>Fläche m²</th><th style={{ textAlign: 'right' }}>MEA</th><th>Notiz</th><th /></tr></thead>
          <tbody>
            {ein.map((e) => (
              <tr key={e.id}>
                <td style={{ width: 140 }}><Cell value={e.bezeichnung} onSave={(v) => uE(e.id, 'bezeichnung', v)} /></td>
                <td style={{ width: 160 }}><Cell type="select" options={KATEGORIEN} value={e.kategorie} onSave={(v) => uE(e.id, 'kategorie', v)} /></td>
                <td style={{ width: 110 }}><Cell type="number" value={e.flaeche} onSave={(v) => uE(e.id, 'flaeche', v)} /></td>
                <td style={{ width: 90 }}><Cell type="number" value={e.mea} onSave={(v) => uE(e.id, 'mea', v)} /></td>
                <td><Cell value={e.notiz} onSave={(v) => uE(e.id, 'notiz', v)} /></td>
                <td style={{ width: 40 }}><button className="iconbtn" title="Löschen" onClick={() => del('bk_einheiten', e.id, 'Einheit „' + e.bezeichnung + '“ mit allen Mietverhältnissen löschen?')}><i className="ti ti-trash" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>Gesamtfläche für die Verteilung (leer = Summe der Einheiten):</span>
          <span style={{ width: 120 }}><Cell type="number" value={abr.gesamtflaeche} onSave={(v) => updAbr('gesamtflaeche', v)} /></span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>Mietverhältnisse {abr.jahr}
          <button className="btn" style={{ marginLeft: 'auto' }} disabled={!ein.length}
            onClick={() => ins('bk_mietverhaeltnisse', { abrechnung_id: abr.id, einheit_id: ein[0].id, mieter: 'Neuer Mieter', von: abr.zeitraum_von })}><i className="ti ti-plus" /> Mietverhältnis</button>
        </h2>
        <p style={{ marginTop: -6, fontSize: 12.5, color: 'var(--muted)' }}>Vorauszahlungen: Soll laut Mietvertrag pro Monat, „gezahlt“ = tatsächlich geleistet im Jahr (aus den Kontoauszügen). Leerstand als eigenes Mietverhältnis mit Art „Leerstand“ – oder einfach leer lassen.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1180 }}>
            <thead><tr><th>Einheit</th><th>Mieter</th><th>von</th><th>bis</th><th>Pers.</th><th>Art</th><th style={{ textAlign: 'right' }}>BK-VZ mtl.</th><th style={{ textAlign: 'right' }}>HK-VZ mtl.</th><th style={{ textAlign: 'right' }}>BK gezahlt</th><th style={{ textAlign: 'right' }}>HK gezahlt</th><th /></tr></thead>
            <tbody>
              {mvs.map((m) => (
                <tr key={m.id}>
                  <td style={{ width: 110 }}><Cell type="select" options={einOpts} value={m.einheit_id} onSave={(v) => uM(m.id, 'einheit_id', v)} /></td>
                  <td style={{ minWidth: 200 }}><Cell value={m.mieter} onSave={(v) => uM(m.id, 'mieter', v)} /></td>
                  <td style={{ width: 140 }}><Cell type="date" value={m.von} onSave={(v) => uM(m.id, 'von', v)} /></td>
                  <td style={{ width: 140 }}><Cell type="date" value={m.bis} onSave={(v) => uM(m.id, 'bis', v)} /></td>
                  <td style={{ width: 64 }}><Cell type="number" value={m.personen} onSave={(v) => uM(m.id, 'personen', v)} /></td>
                  <td style={{ width: 170 }}><Cell type="select" options={MV_ARTEN} value={m.art} onSave={(v) => uM(m.id, 'art', v)} /></td>
                  <td style={{ width: 96 }}><Cell type="number" value={m.vz_bk_mtl} onSave={(v) => uM(m.id, 'vz_bk_mtl', v)} /></td>
                  <td style={{ width: 96 }}><Cell type="number" value={m.vz_hk_mtl} onSave={(v) => uM(m.id, 'vz_hk_mtl', v)} /></td>
                  <td style={{ width: 104 }}><Cell type="number" value={m.vz_bk_gezahlt} onSave={(v) => uM(m.id, 'vz_bk_gezahlt', v)} /></td>
                  <td style={{ width: 104 }}><Cell type="number" value={m.vz_hk_gezahlt} onSave={(v) => uM(m.id, 'vz_hk_gezahlt', v)} /></td>
                  <td style={{ width: 40 }}><button className="iconbtn" title="Löschen" onClick={() => del('bk_mietverhaeltnisse', m.id, 'Mietverhältnis „' + m.mieter + '“ löschen?')}><i className="ti ti-trash" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ---------------- Verteilerschlüssel ---------------- */
function SchluesselTab({ abr, ein, mvs, kas, aus, upd, ins, del, setKas, load }) {
  const uK = upd('bk_kostenarten', setKas)
  const [open, setOpen] = useState(null)

  async function standard() {
    const vorhanden = new Set(kas.map((k) => k.name))
    const rows = STANDARD_KOSTENARTEN.filter((k) => !vorhanden.has(k.name)).map((k, i) => ({ ...k, abrechnung_id: abr.id, pos: kas.length + i }))
    if (!rows.length) return
    const { error } = await supabase.from('bk_kostenarten').insert(rows)
    if (error) { alert(error.message); return }
    load()
  }
  async function kopieren() {
    const { data: prev } = await supabase.from('bk_abrechnungen').select('id, jahr').eq('kennung', abr.kennung).lt('jahr', abr.jahr).order('jahr', { ascending: false }).limit(1)
    if (!prev || !prev.length) { alert('Keine Abrechnung aus einem Vorjahr für ' + abr.kennung + ' gefunden.'); return }
    const { data: alt } = await supabase.from('bk_kostenarten').select('name, gruppe, schluessel, umlagefaehig, betrkv_nr, pos, notiz').eq('abrechnung_id', prev[0].id)
    const vorhanden = new Set(kas.map((k) => k.name))
    const rows = (alt || []).filter((k) => !vorhanden.has(k.name)).map((k) => ({ ...k, abrechnung_id: abr.id }))
    if (rows.length) { const { error } = await supabase.from('bk_kostenarten').insert(rows); if (error) alert(error.message) }
    load()
  }

  const einOpts = [{ v: '', label: '– Einheit wählen –' }, ...ein.map((e) => ({ v: e.id, label: e.bezeichnung }))]
  const mvOpts = [{ v: '', label: '– Mieter wählen –' }, ...mvs.map((m) => ({ v: m.id, label: m.mieter + ' (' + ((ein.find((e) => e.id === m.einheit_id) || {}).bezeichnung || '') + ')' }))]

  return (
    <div className="card">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Kostenarten & Verteilerschlüssel
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={kopieren} title="Kostenarten und Schlüssel aus dem Vorjahr übernehmen"><i className="ti ti-copy" /> Aus Vorjahr</button>
          <button className="btn btn-ghost" onClick={standard}><i className="ti ti-list-check" /> Standard-Kostenarten</button>
          <button className="btn" onClick={() => ins('bk_kostenarten', { abrechnung_id: abr.id, name: 'Neue Kostenart', pos: kas.length })}><i className="ti ti-plus" /> Kostenart</button>
        </span>
      </h2>
      <p style={{ marginTop: -6, fontSize: 12.5, color: 'var(--muted)' }}>
        Je Kostenart einen Schlüssel festlegen. Abweichende Regeln für einzelne Einheiten oder Mieter unter „Ausnahmen“ – z. B. „WE 12 nimmt nicht teil“ oder „Stromvertrag nur Mieter X“.
      </p>
      <table className="tbl">
        <thead><tr><th>Kostenart</th><th>Gruppe</th><th>Verteilerschlüssel</th><th>umlagefähig</th><th>Ausnahmen</th><th /></tr></thead>
        <tbody>
          {kas.map((k) => {
            const ex = aus.filter((a) => a.kostenart_id === k.id)
            const isOpen = open === k.id
            return (
              <FragmentRow key={k.id}>
                <tr>
                  <td><Cell value={k.name} onSave={(v) => uK(k.id, 'name', v)} /></td>
                  <td style={{ width: 150 }}><Cell type="select" options={[{ v: 'betriebskosten', label: 'Betriebskosten' }, { v: 'heizkosten', label: 'Heizkosten' }]} value={k.gruppe} onSave={(v) => uK(k.id, 'gruppe', v)} /></td>
                  <td style={{ width: 250 }}><Cell type="select" options={SCHLUESSEL} value={k.schluessel} onSave={(v) => uK(k.id, 'schluessel', v)} /></td>
                  <td style={{ width: 90, textAlign: 'center' }}><Cell type="checkbox" value={k.umlagefaehig} onSave={(v) => uK(k.id, 'umlagefaehig', v)} /></td>
                  <td style={{ width: 150 }}>
                    <button className="linkbtn" onClick={() => setOpen(isOpen ? null : k.id)} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', font: 'inherit' }}>
                      {ex.length ? ex.length + ' Ausnahme' + (ex.length > 1 ? 'n' : '') : 'keine'} <i className={'ti ' + (isOpen ? 'ti-chevron-up' : 'ti-chevron-down')} />
                    </button>
                  </td>
                  <td style={{ width: 40 }}><button className="iconbtn" title="Löschen" onClick={() => del('bk_kostenarten', k.id, 'Kostenart „' + k.name + '“ löschen? Zugeordnete Kosten verlieren ihre Kostenart.')}><i className="ti ti-trash" /></button></td>
                </tr>
                {isOpen && (
                  <tr><td colSpan={6} style={{ background: 'var(--surface-2)' }}>
                    <Ausnahmen k={k} ex={ex} einOpts={einOpts} mvOpts={mvOpts} ins={ins} del={del} />
                    <Vorschau k={k} ein={ein} mvs={mvs} ex={ex} />
                  </td></tr>
                )}
              </FragmentRow>
            )
          })}
        </tbody>
      </table>
      {!kas.length && <p style={{ color: 'var(--muted)' }}>Noch keine Kostenarten. Tipp: „Standard-Kostenarten“ legt die üblichen Positionen nach § 2 BetrKV mit Vorschlags-Schlüssel an.</p>}
    </div>
  )
}
function FragmentRow({ children }) { return <>{children}</> }

function Ausnahmen({ k, ex, einOpts, mvOpts, ins, del }) {
  const [neu, setNeu] = useState({ ziel: 'einheit', einheit_id: '', mietverhaeltnis_id: '', art: 'ausschliessen', wert: '', notiz: '' })
  async function add() {
    if (neu.ziel === 'einheit' && !neu.einheit_id) { alert('Bitte Einheit wählen.'); return }
    if (neu.ziel === 'mieter' && !neu.mietverhaeltnis_id) { alert('Bitte Mieter wählen.'); return }
    await ins('bk_ausnahmen', {
      kostenart_id: k.id, art: neu.art, notiz: neu.notiz || null,
      wert: neu.wert === '' ? null : Number(String(neu.wert).replace(',', '.')),
      einheit_id: neu.ziel === 'einheit' ? neu.einheit_id : null,
      mietverhaeltnis_id: neu.ziel === 'mieter' ? neu.mietverhaeltnis_id : null,
    })
    setNeu({ ...neu, wert: '', notiz: '' })
  }
  const sel = { font: 'inherit', fontSize: 13, padding: '5px 7px', borderRadius: 7, border: '1px solid var(--line)' }
  return (
    <div style={{ marginBottom: 12 }}>
      <b style={{ fontSize: 13 }}>Ausnahmen für „{k.name}“</b>
      {ex.length > 0 && (
        <ul style={{ margin: '6px 0 10px', paddingLeft: 18, fontSize: 13 }}>
          {ex.map((a) => (
            <li key={a.id}>
              {(a.einheit_id ? (einOpts.find((o) => o.v === a.einheit_id) || {}).label : (mvOpts.find((o) => o.v === a.mietverhaeltnis_id) || {}).label) || '?'}
              {' → '}{ausnahmeLabel(a.art)}{a.wert != null ? ' (' + num(a.wert) + (a.art === 'fester_anteil' ? ' %' : '') + ')' : ''}{a.notiz ? ' · ' + a.notiz : ''}
              <button className="iconbtn" style={{ fontSize: 14 }} onClick={() => del('bk_ausnahmen', a.id)}><i className="ti ti-x" /></button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <select style={sel} value={neu.ziel} onChange={(e) => setNeu({ ...neu, ziel: e.target.value })}><option value="einheit">Einheit</option><option value="mieter">Mieter</option></select>
        {neu.ziel === 'einheit'
          ? <select style={sel} value={neu.einheit_id} onChange={(e) => setNeu({ ...neu, einheit_id: e.target.value })}>{einOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
          : <select style={sel} value={neu.mietverhaeltnis_id} onChange={(e) => setNeu({ ...neu, mietverhaeltnis_id: e.target.value })}>{mvOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>}
        <select style={sel} value={neu.art} onChange={(e) => setNeu({ ...neu, art: e.target.value })}>{AUSNAHME_ARTEN.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
        {(neu.art === 'faktor' || neu.art === 'fester_anteil') && <input style={{ ...sel, width: 80 }} placeholder={neu.art === 'faktor' ? 'z. B. 0,5' : '%'} value={neu.wert} onChange={(e) => setNeu({ ...neu, wert: e.target.value })} />}
        <input style={{ ...sel, flex: 1, minWidth: 160 }} placeholder="Notiz / Begründung" value={neu.notiz} onChange={(e) => setNeu({ ...neu, notiz: e.target.value })} />
        <button className="btn" onClick={add}><i className="ti ti-plus" /> Ausnahme</button>
      </div>
    </div>
  )
}

function Vorschau({ k, ein, mvs, ex }) {
  if (['verbrauch', 'direkt', 'nicht_umlegen'].includes(k.schluessel)) {
    const txt = { verbrauch: 'Verteilung nach Verbrauch – die Werte kommen aus der Messdienst-Abrechnung bzw. den Zählerständen.', direkt: 'Direktkosten – werden beim Erfassen der Kosten einem Mieter zugeordnet.', nicht_umlegen: 'Wird nicht umgelegt, der Vermieter trägt die Kosten.' }
    return <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>{txt[k.schluessel]}</p>
  }
  const rows = anteileVorschau(k.schluessel, ein, mvs, ex)
  return (
    <div>
      <b style={{ fontSize: 13 }}>Vorschau Anteile ({schluesselLabel(k.schluessel)})</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {rows.map((r) => (
          <span key={r.einheit.id} className="badge" style={{ background: r.anteil ? 'var(--brand-soft)' : '#eee', color: r.anteil ? 'var(--brand)' : '#888' }}>
            {r.einheit.bezeichnung}: {num(r.anteil * 100, 2)} %
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Kosten ---------------- */
function KostenTab({ abr, kas, mvs, kosten, upd, ins, del, setKosten }) {
  const uK = upd('bk_kosten', setKosten)
  const [filter, setFilter] = useState('')
  const kaOpts = [{ v: '', label: '– ohne Kostenart –' }, ...kas.map((k) => ({ v: k.id, label: k.name }))]
  const mvOpts = [{ v: '', label: '–' }, ...mvs.map((m) => ({ v: m.id, label: m.mieter }))]
  const summen = useMemo(() => {
    const s = {}; kosten.forEach((k) => { const key = k.kostenart_id || ''; s[key] = (s[key] || 0) + (Number(k.betrag) || 0) }); return s
  }, [kosten])
  const list = filter === '' ? kosten : kosten.filter((k) => (k.kostenart_id || '-') === filter)
  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <h2>Summen je Kostenart</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {kas.map((k) => (
            <button key={k.id} className={'chip' + (filter === k.id ? ' active' : '')} onClick={() => setFilter(filter === k.id ? '' : k.id)}>
              {k.name}: <b>{eur(summen[k.id] || 0)}</b>
            </button>
          ))}
          {summen[''] ? <button className={'chip' + (filter === '-' ? ' active' : '')} onClick={() => setFilter(filter === '-' ? '' : '-')} style={{ borderColor: '#e5484d', color: '#e5484d' }}>ohne Kostenart: <b>{eur(summen[''])}</b></button> : null}
        </div>
      </div>
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>Kostenbuchungen {abr.jahr}
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => ins('bk_kosten', { abrechnung_id: abr.id, betrag: 0, datum: abr.zeitraum_bis, quelle: 'manuell' })}><i className="ti ti-plus" /> Kosten</button>
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1100 }}>
            <thead><tr><th>Datum</th><th>Empfänger</th><th>Verwendungszweck</th><th style={{ textAlign: 'right' }}>Betrag</th><th>Kostenart</th><th>Direkt an Mieter</th><th>Quelle</th><th /></tr></thead>
            <tbody>
              {list.map((k) => (
                <tr key={k.id}>
                  <td style={{ width: 140 }}><Cell type="date" value={k.datum} onSave={(v) => uK(k.id, 'datum', v)} /></td>
                  <td style={{ width: 190 }}><Cell value={k.empfaenger} onSave={(v) => uK(k.id, 'empfaenger', v)} /></td>
                  <td><Cell value={k.verwendungszweck} onSave={(v) => uK(k.id, 'verwendungszweck', v)} /></td>
                  <td style={{ width: 110 }}><Cell type="number" value={k.betrag} onSave={(v) => uK(k.id, 'betrag', v ?? 0)} /></td>
                  <td style={{ width: 200 }}><Cell type="select" options={kaOpts} value={k.kostenart_id || ''} onSave={(v) => uK(k.id, 'kostenart_id', v || null)} /></td>
                  <td style={{ width: 160 }}><Cell type="select" options={mvOpts} value={k.mietverhaeltnis_id || ''} onSave={(v) => uK(k.id, 'mietverhaeltnis_id', v || null)} /></td>
                  <td style={{ width: 90, fontSize: 12, color: 'var(--muted)' }}>{k.quelle}{k.konto ? ' · ' + k.konto : ''}</td>
                  <td style={{ width: 40 }}><button className="iconbtn" title="Löschen" onClick={() => del('bk_kosten', k.id, 'Buchung löschen?')}><i className="ti ti-trash" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ---------------- Prüfung ---------------- */
function PruefungTab({ abr, ein, mvs, kas, kosten }) {
  const checks = []
  const add = (ok, text, level = 'rot') => checks.push({ ok, text, level })
  add(ein.length > 0, 'Einheiten angelegt')
  ein.forEach((e) => {
    if (!e.flaeche && kas.some((k) => k.schluessel === 'flaeche')) add(false, `${e.bezeichnung}: Fläche fehlt (nötig für Schlüssel Fläche)`)
    const l = luecken(e.id, mvs, abr.zeitraum_von, abr.zeitraum_bis)
    if (l > 0) add(false, `${e.bezeichnung}: ${l} Tage ohne Mietverhältnis – Leerstand? (Kostenanteil trägt dann der Vermieter)`, 'gelb')
    ueberschneidungen(e.id, mvs, abr.zeitraum_bis).forEach(([a, b]) => add(false, `${e.bezeichnung}: „${a.mieter}“ und „${b.mieter}“ überschneiden sich`))
  })
  mvs.forEach((m) => {
    if (m.von < abr.zeitraum_von || (m.bis && m.bis > abr.zeitraum_bis)) add(false, `${m.mieter}: Zeitraum liegt teilweise außerhalb des Abrechnungszeitraums`, 'gelb')
    if (m.art === 'vorauszahlung' && m.vz_bk_gezahlt == null && m.vz_hk_gezahlt == null) add(false, `${m.mieter}: geleistete Vorauszahlungen fehlen`, 'gelb')
    if (m.art === 'vorauszahlung' && !m.personen && kas.some((k) => k.schluessel === 'personen')) add(false, `${m.mieter}: Personenzahl fehlt (Schlüssel Personen wird genutzt)`)
  })
  add(kas.length > 0, 'Kostenarten mit Verteilerschlüssel angelegt')
  const ohne = kosten.filter((k) => !k.kostenart_id)
  if (ohne.length) add(false, `${ohne.length} Kostenbuchung(en) ohne Kostenart`)
  kas.filter((k) => k.schluessel === 'direkt').forEach((k) => {
    const n = kosten.filter((x) => x.kostenart_id === k.id && !x.mietverhaeltnis_id).length
    if (n) add(false, `${k.name}: ${n} Direktkosten ohne zugeordneten Mieter`)
  })
  const offen = checks.filter((c) => !c.ok)
  return (
    <div className="card">
      <h2>Prüfung vor der Berechnung</h2>
      {offen.length === 0 ? <p style={{ color: '#0f7a4a' }}><i className="ti ti-circle-check" /> Alles vollständig – die Abrechnung kann berechnet werden.</p> : (
        <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {offen.map((c, i) => (
            <li key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--line)', display: 'flex', gap: 8 }}>
              <i className={'ti ' + (c.level === 'rot' ? 'ti-alert-circle' : 'ti-alert-triangle')} style={{ color: c.level === 'rot' ? '#e5484d' : '#d97706' }} /> {c.text}
            </li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 14 }}>Die eigentliche Berechnung und das PDF je Mieter folgen im nächsten Schritt.</p>
    </div>
  )
}
