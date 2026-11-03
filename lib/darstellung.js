// Persönliche Darstellung (Farbe, Größe, Hintergrund) – gilt nur im Bereich Verwalto.
// Gespeichert je Benutzer in Supabase (nutzer_einstellungen), zwischengespeichert im Browser.
export const FARBEN = [
  { v: 'blau', label: 'Blau (Standard)', c: '#185fa5' },
  { v: 'petrol', label: 'Petrol', c: '#0f766e' },
  { v: 'gruen', label: 'Grün', c: '#1d7a4c' },
  { v: 'violett', label: 'Violett', c: '#6d4fa3' },
  { v: 'bordeaux', label: 'Bordeaux', c: '#9d174d' },
  { v: 'orange', label: 'Orange', c: '#b45309' },
  { v: 'schiefer', label: 'Schiefer', c: '#475569' },
]
export const GROESSEN = [
  { v: 'klein', label: 'Klein', z: 0.9 },
  { v: 'normal', label: 'Normal', z: 1 },
  { v: 'gross', label: 'Groß', z: 1.12 },
  { v: 'sehrgross', label: 'Sehr groß', z: 1.25 },
]
export const HINTERGRUENDE = [
  { v: 'standard', label: 'Standard', c: '' },
  { v: 'warm', label: 'Warm', c: '#f6f3ec' },
  { v: 'kuehl', label: 'Kühl', c: '#edf2f7' },
  { v: 'weiss', label: 'Weiß', c: '#ffffff' },
]
export const STANDARD = { farbe: 'blau', groesse: 'normal', hintergrund: 'standard' }
const KEY = 'os_darstellung'

export function lokalLesen() {
  try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x && x.d ? x : null } catch (e) { return null }
}
export function lokalSetzen(uid, d) {
  try { localStorage.setItem(KEY, JSON.stringify({ uid, d })) } catch (e) {}
  try { (window.top || window).dispatchEvent(new Event('os-darstellung')) } catch (e) {}
}
const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) }
const mix = (c, ziel, p) => { const a = hex(c), b = hex(ziel); return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * p).toString(16).padStart(2, '0')).join('') }

// art: 'top' (Menü + Reiterleiste), 'wrap' (Next-Seite im Reiter), 'leaf' (eingebettete HTML-Seite), 'farbe' (nur Farben)
export function cssFuer(d, art) {
  if (!d) return ''
  const f = (FARBEN.find((x) => x.v === d.farbe) || FARBEN[0]).c
  const z = (GROESSEN.find((x) => x.v === d.groesse) || GROESSEN[1]).z
  const bg = (HINTERGRUENDE.find((x) => x.v === d.hintergrund) || HINTERGRUENDE[0]).c
  let v = '--accent:' + f + ';--accent2:' + mix(f, '#000000', 0.18) + ';--brand:' + f + ';--brand-soft:' + mix(f, '#ffffff', 0.88) + ';'
  if (bg) v += '--bg:' + bg + ';'
  let css = ':root:root{' + v + '}'
  if (bg) css += 'body{background:' + bg + '}'
  if (z !== 1) {
    if (art === 'top') css += 'aside.sbx,.ostabs{zoom:' + z + '}'
    else if (art === 'wrap') css += 'main.main:not(:has(iframe)){zoom:' + z + '}'
    else if (art === 'leaf') css += 'body{zoom:' + z + '}'
  }
  return css
}
