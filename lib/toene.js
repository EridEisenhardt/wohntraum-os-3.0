// Benachrichtigungstöne für das OS, erzeugt im Browser (keine Tondateien nötig).
// Jeder Ton ist eine kurze Folge von Tönen: [Frequenz in Hz, Start in s, Dauer in s, Klangform]
export const TOENE = [
  { id: 'zwei', name: 'Zwei Töne (sanft)', folge: [[660, 0, 0.18, 'sine'], [880, 0.16, 0.28, 'sine']] },
  { id: 'dreiklang', name: 'Dreiklang (aufsteigend)', folge: [[523, 0, 0.14, 'triangle'], [659, 0.12, 0.14, 'triangle'], [784, 0.24, 0.3, 'triangle']] },
  { id: 'alarm', name: 'Drei kurze Signale (deutlich)', folge: [[988, 0, 0.1, 'square'], [988, 0.17, 0.1, 'square'], [988, 0.34, 0.16, 'square']] },
  { id: 'pling', name: 'Pling (kurz)', folge: [[1318, 0, 0.12, 'sine'], [1760, 0.06, 0.22, 'sine']] },
  { id: 'glocke', name: 'Glocke', folge: [[784, 0, 0.9, 'sine'], [1568, 0, 0.5, 'sine'], [2352, 0, 0.25, 'sine']] },
  { id: 'klopfen', name: 'Klopfen', folge: [[220, 0, 0.07, 'square'], [220, 0.14, 0.07, 'square']] },
]
export const BEREICHE = [
  { id: 'mail', name: 'Neue Mails im Postfach', ton: 'zwei', pfad: '/verwalto/postfach' },
  { id: 'stoerung', name: 'Neue Störungsmeldungen', ton: 'alarm', pfad: '/hausverwaltung/stoerungen' },
  { id: 'cliq', name: 'Neue Nachrichten in Cliq', ton: 'pling', pfad: '/verwalto/cliq' },
]
export const SCHLUESSEL = 'os_benachrichtigung'
export function einstellungen() {
  let e = {}
  try { e = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}') || {} } catch (x) {}
  const out = { laut: e.laut == null ? 0.6 : Number(e.laut), desktop: !!e.desktop }
  for (const b of BEREICHE) out[b.id] = Object.assign({ an: true, ton: b.ton }, e[b.id] || {})
  return out
}
export function speichern(e) { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(e)) } catch (x) {} }

let CTX = null
function ctx() {
  if (typeof window === 'undefined') return null
  const A = window.AudioContext || window.webkitAudioContext
  if (!A) return null
  if (!CTX) CTX = new A()
  if (CTX.state === 'suspended') CTX.resume().catch(() => {})
  return CTX
}
// Browser erlauben Ton erst nach einem Klick: beim ersten Klick freischalten
export function tonFreischalten() {
  if (typeof window === 'undefined') return
  const f = () => { ctx(); window.removeEventListener('pointerdown', f, true); window.removeEventListener('keydown', f, true) }
  window.addEventListener('pointerdown', f, true); window.addEventListener('keydown', f, true)
}
export function spiele(id, laut) {
  const c = ctx(); if (!c) return
  const t = TOENE.find(x => x.id === id) || TOENE[0]
  const v = Math.max(0, Math.min(1, laut == null ? 0.6 : laut)) * 0.35
  const t0 = c.currentTime + 0.02
  for (const [f, s, d, form] of t.folge) {
    const o = c.createOscillator(), g = c.createGain()
    o.type = form; o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t0 + s)
    g.gain.exponentialRampToValueAtTime(form === 'square' ? v * 0.35 : v, t0 + s + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + d)
    o.connect(g); g.connect(c.destination)
    o.start(t0 + s); o.stop(t0 + s + d + 0.05)
  }
}
