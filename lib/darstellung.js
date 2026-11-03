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
export const STANDARD = { farbe: 'blau', groesse: 'normal', hintergrund: 'standard', modus: 'hell' }
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
    // Menü: Inhalt vergrößern, Breite mitwachsen lassen (die Leiste selbst behält 100vh Höhe)
    if (art === 'top') css += '@media(min-width:821px){aside.sbx{width:' + Math.round(284 * z) + 'px}}aside.sbx>*,.ostabs{zoom:' + z + '}'
    // Seiten im Reiter: eingebettete Seite wie mit der Browser-Lupe skalieren. Die Seite bekommt einen
    // entsprechend kleineren Sichtbereich, damit Dialoge und volle Höhen (100vh) weiter passen.
    else if (art === 'wrap') css += 'main.main:not(:has(iframe)){zoom:' + z + '}main.main iframe{transform:scale(' + z + ');transform-origin:0 0;width:calc(100% / ' + z + ')!important;height:calc(100% / ' + z + ')!important}main.main :has(> iframe){overflow:hidden}'
  }
  if (d.modus === 'dunkel') css += dunkelCss(art)
  return css
}

export const MODI = [
  { v: 'hell', label: 'Hell' },
  { v: 'dunkel', label: 'Dunkel' },
]
const TOENE = { warm: { h: 40, s: 0.42 }, kuehl: { h: 212, s: 0.38 } }
const zuHsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2
  if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60 }
  return [h, s, l] }
const zuRgb = (h, s, l) => { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)) }

// Liefert eine Funktion, die eine Farbe (r,g,b) passend zur Einstellung umfärbt, oder null, wenn nichts zu tun ist.
export function umfaerber(d) {
  if (!d) return null
  const f = (FARBEN.find((x) => x.v === d.farbe) || FARBEN[0])
  const ton = TOENE[d.hintergrund] || null
  if (f.v === 'blau' && !ton) return null
  const [ah, as] = zuHsl(...hex(f.c))
  return (r, g, b) => {
    const [h, s, l] = zuHsl(r, g, b)
    if (f.v !== 'blau' && h >= 185 && h <= 235 && s >= 0.3 && l > 0.12 && l < 0.97) return zuRgb(ah, as * Math.min(1, s / 0.55), l)
    if (ton && s < 0.3 && l >= 0.86) return zuRgb(ton.h, ton.s, l > 0.985 ? 0.985 : l)
    return null
  }
}
export function dunkelCss(art) {
  const f = 'filter:invert(.9) hue-rotate(180deg)'
  const zur = 'img,video,canvas,picture,iframe,embed,object{filter:invert(1) hue-rotate(180deg)}'
  if (art === 'top') return 'aside.sbx,.ostabs{' + f + '}aside.sbx img{filter:invert(1) hue-rotate(180deg)}.ostabs-flaeche{background:#1b1d22}'
  if (art === 'wrap') return 'main.main:not(:has(iframe)){' + f + '}main.main:not(:has(iframe)) :is(img,video,canvas){filter:invert(1) hue-rotate(180deg)}'
  if (art === 'leaf') return 'html{' + f + ';background:#fff}' + zur
  return ''
}
