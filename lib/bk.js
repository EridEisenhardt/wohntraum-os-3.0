// Betriebskostenabrechnung – gemeinsame Konstanten und Hilfsfunktionen

export const SCHLUESSEL = [
  { v: 'flaeche', label: 'Wohn-/Nutzfläche (m²)' },
  { v: 'personen', label: 'Personen' },
  { v: 'einheiten', label: 'Einheiten (je Einheit gleich)' },
  { v: 'mea', label: 'Miteigentumsanteile' },
  { v: 'verbrauch', label: 'Verbrauch (Messdienst/Zähler)' },
  { v: 'direkt', label: 'Direkt einem Mieter zugeordnet' },
  { v: 'nicht_umlegen', label: 'Nicht umlegen (trägt Vermieter)' },
]
export const schluesselLabel = (v) => (SCHLUESSEL.find((s) => s.v === v) || {}).label || v

export const AUSNAHME_ARTEN = [
  { v: 'ausschliessen', label: 'nimmt nicht teil' },
  { v: 'nur_diese', label: 'nur diese tragen die Kosten' },
  { v: 'faktor', label: 'Gewichtung (Faktor)' },
  { v: 'fester_anteil', label: 'fester Anteil in %' },
]
export const ausnahmeLabel = (v) => (AUSNAHME_ARTEN.find((s) => s.v === v) || {}).label || v

export const MV_ARTEN = [
  { v: 'vorauszahlung', label: 'Vorauszahlung (wird abgerechnet)' },
  { v: 'pauschale', label: 'Pauschale (keine Abrechnung)' },
  { v: 'leerstand', label: 'Leerstand' },
  { v: 'eigennutzung', label: 'Eigennutzung' },
]

export const KATEGORIEN = [
  { v: 'wohnen', label: 'Wohnen' },
  { v: 'gewerbe', label: 'Gewerbe' },
  { v: 'stellplatz', label: 'Stellplatz/Garage' },
  { v: 'sonstiges', label: 'Sonstiges' },
]

export const STATUS = [
  { v: 'entwurf', label: 'Entwurf', color: '#6b7280' },
  { v: 'daten_vollstaendig', label: 'Daten vollständig', color: '#185fa5' },
  { v: 'berechnet', label: 'Berechnet', color: '#7a5af8' },
  { v: 'geprueft', label: 'Geprüft', color: '#0e9384' },
  { v: 'versendet', label: 'Versendet', color: '#16a34a' },
  { v: 'nicht_abrechnen', label: 'Nicht abrechnen', color: '#9aa1ab' },
]
export const statusOf = (v) => STATUS.find((s) => s.v === v) || STATUS[0]

// Standard-Kostenarten nach § 2 BetrKV. Schlüssel = Vorschlag, je Objekt änderbar.
export const STANDARD_KOSTENARTEN = [
  { betrkv_nr: '1', name: 'Grundsteuer', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '2', name: 'Frischwasser', gruppe: 'betriebskosten', schluessel: 'personen' },
  { betrkv_nr: '3', name: 'Schmutzwasser', gruppe: 'betriebskosten', schluessel: 'personen' },
  { betrkv_nr: '3', name: 'Niederschlagswasser', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '4', name: 'Heizung (Brennstoff, Wartung, Messdienst)', gruppe: 'heizkosten', schluessel: 'verbrauch' },
  { betrkv_nr: '5', name: 'Warmwasser', gruppe: 'heizkosten', schluessel: 'verbrauch' },
  { betrkv_nr: '8', name: 'Müllabfuhr', gruppe: 'betriebskosten', schluessel: 'personen' },
  { betrkv_nr: '8', name: 'Straßenreinigung', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '9', name: 'Gebäudereinigung', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '10', name: 'Gartenpflege', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '11', name: 'Allgemeinstrom', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '12', name: 'Schornsteinfeger', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '13', name: 'Gebäudeversicherung / Haftpflicht', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '14', name: 'Hausmeister', gruppe: 'betriebskosten', schluessel: 'flaeche' },
  { betrkv_nr: '15', name: 'Kabel-TV / Antenne', gruppe: 'betriebskosten', schluessel: 'einheiten' },
  { betrkv_nr: '17', name: 'Rauchwarnmelder (Wartung/Miete)', gruppe: 'betriebskosten', schluessel: 'einheiten' },
]

export const eur = (n) => (n == null || n === '' || isNaN(Number(n)) ? '—'
  : Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €')
export const num = (n, d = 2) => (n == null || n === '' || isNaN(Number(n)) ? '—'
  : Number(n).toLocaleString('de-DE', { maximumFractionDigits: d }))
export const fmtDate = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('de-DE') : '—')

// Tage zwischen zwei ISO-Daten (inklusive)
export function tage(von, bis) {
  const a = new Date(von + 'T00:00:00Z'), b = new Date(bis + 'T00:00:00Z')
  return Math.round((b - a) / 86400000) + 1
}

// Monate, in denen eine Einheit im Abrechnungszeitraum KEIN Mietverhältnis hat (Leerstand)
export function luecken(einheitId, mvs, von, bis) {
  const own = mvs.filter((m) => m.einheit_id === einheitId)
  const out = []
  let d = new Date(von + 'T00:00:00Z'); const end = new Date(bis + 'T00:00:00Z')
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10)
    const hit = own.some((m) => m.von <= iso && (!m.bis || m.bis >= iso))
    if (!hit) out.push(iso)
    d = new Date(d.getTime() + 86400000)
  }
  return out.length
}

// Überschneidungen von Mietverhältnissen auf derselben Einheit
export function ueberschneidungen(einheitId, mvs, bis) {
  const own = mvs.filter((m) => m.einheit_id === einheitId).sort((a, b) => (a.von < b.von ? -1 : 1))
  const res = []
  for (let i = 1; i < own.length; i++) {
    const prevEnd = own[i - 1].bis || bis
    if (own[i].von <= prevEnd) res.push([own[i - 1], own[i]])
  }
  return res
}

// Vorschau Verteilung: Anteil je Einheit für einen Schlüssel inkl. Ausnahmen.
// Rückgabe: [{ einheit, basis, anteil (0..1) }] – zeitanteilig noch ohne Mieterwechsel.
export function anteileVorschau(schluessel, einheiten, mvs, ausnahmen) {
  const nur = ausnahmen.filter((a) => a.art === 'nur_diese' && a.einheit_id).map((a) => a.einheit_id)
  const rows = einheiten.map((e) => {
    let basis = 0
    if (schluessel === 'flaeche') basis = Number(e.flaeche) || 0
    else if (schluessel === 'mea') basis = Number(e.mea) || 0
    else if (schluessel === 'einheiten') basis = 1
    else if (schluessel === 'personen') {
      const own = mvs.filter((m) => m.einheit_id === e.id)
      basis = own.length ? Math.max(...own.map((m) => Number(m.personen) || 0)) : 0
    }
    const ex = ausnahmen.filter((a) => a.einheit_id === e.id)
    if (ex.some((a) => a.art === 'ausschliessen')) basis = 0
    if (nur.length && !nur.includes(e.id)) basis = 0
    const f = ex.find((a) => a.art === 'faktor'); if (f && f.wert != null) basis *= Number(f.wert)
    const fest = ex.find((a) => a.art === 'fester_anteil')
    return { einheit: e, basis, fest: fest ? Number(fest.wert) / 100 : null }
  })
  const festSum = rows.reduce((s, r) => s + (r.fest || 0), 0)
  const rest = Math.max(0, 1 - festSum)
  const sum = rows.filter((r) => r.fest == null).reduce((s, r) => s + r.basis, 0)
  return rows.map((r) => ({ ...r, anteil: r.fest != null ? r.fest : (sum ? (r.basis / sum) * rest : 0) }))
}
