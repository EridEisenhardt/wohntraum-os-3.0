'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { cssFuer, lokalLesen, lokalSetzen, umfaerber } from '@/lib/darstellung'

// Wendet die persönliche Darstellung im obersten Fenster und in allen eingebetteten Seiten an –
// aber nur, solange der Bereich Verwalto aktiv ist. Im Bereich Eric bleibt alles unverändert.
function stil(doc, css) {
  if (!doc || !doc.documentElement) return
  let el = doc.getElementById('os-darst')
  if (!css) { if (el) el.remove(); return }
  if (!el) { el = doc.createElement('style'); el.id = 'os-darst'; (doc.head || doc.documentElement).appendChild(el) }
  else if (el !== (doc.head || doc.documentElement).lastElementChild) (doc.head || doc.documentElement).appendChild(el)
  if (el.textContent !== css) el.textContent = css
}
// Fest eingebaute Farben in den Stylesheets einer Seite umfärben (Blautöne -> Akzentfarbe, helle Grautöne -> Hintergrundton).
// Die Originalwerte werden gemerkt, damit beim Wechsel (z. B. in den Bereich Eric) alles zurückgestellt wird.
const FARBRE = /#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*([,/]\s*[\d.]+%?\s*)?\)/gi
function wert(v, fn) {
  return v.replace(FARBRE, (m, hx, r, g, b, a) => {
    let c
    if (hx) { const h = hx.length === 3 ? hx.split('').map((x) => x + x).join('') : hx; c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) } else c = [+r, +g, +b]
    const n = fn(c[0], c[1], c[2]); if (!n) return m
    if (hx) return '#' + n.map((x) => x.toString(16).padStart(2, '0')).join('')
    return a ? 'rgba(' + n.join(',') + ',' + String(a).replace(/[,/]/, '').trim() + ')' : 'rgb(' + n.join(',') + ')'
  })
}
function regeln(liste, fn, aus) {
  for (const r of Array.from(liste || [])) {
    if (r.cssRules && !r.style) { regeln(r.cssRules, fn, aus); continue }
    if (!r.style) continue
    if (!r.__osOrig) { if (aus) continue; const o = []; for (let i = 0; i < r.style.length; i++) { const n = r.style[i], v = r.style.getPropertyValue(n); if (FARBRE.test(v)) o.push([n, v, r.style.getPropertyPriority(n)]); FARBRE.lastIndex = 0 } r.__osOrig = o }
    for (const [n, v, p] of r.__osOrig) { const nv = aus ? v : wert(v, fn); if (r.style.getPropertyValue(n) !== nv) r.style.setProperty(n, nv, p) }
  }
}
function faerben(doc, d) {
  const fn = umfaerber(d), key = fn ? JSON.stringify([d.farbe, d.hintergrund]) : ''
  const sig = key + '|' + doc.styleSheets.length
  if (doc.__osFarbe === sig) return
  doc.__osFarbe = sig
  for (const sh of Array.from(doc.styleSheets)) { let rl = null; try { rl = sh.cssRules } catch (e) { rl = null } if (rl && !(sh.ownerNode && sh.ownerNode.id === 'os-darst')) regeln(rl, fn, !fn) }
}
function durchlaufen(doc, art, d) {
  stil(doc, cssFuer(d, art))
  try { faerben(doc, d) } catch (e) {}
  doc.querySelectorAll('iframe').forEach((f) => {
    let cd = null
    try { cd = f.contentDocument } catch (e) { cd = null }
    if (!cd || !cd.documentElement) return
    const next = !!cd.querySelector('main.main')
    durchlaufen(cd, next ? 'wrap' : (art === 'leaf' || art === 'farbe' ? 'farbe' : 'leaf'), d)
  })
}

export default function Darstellung({ session }) {
  const uid = session && session.user ? session.user.id : ''
  useEffect(() => {
    if (!uid) return
    let weg = false
    supabase.from('nutzer_einstellungen').select('darstellung').eq('user_id', uid).maybeSingle().then(({ data }) => {
      if (weg) return
      lokalSetzen(uid, data && data.darstellung && Object.keys(data.darstellung).length ? data.darstellung : null)
    })
    const lauf = () => {
      const l = lokalLesen()
      const d = l && l.uid === uid ? l.d : null
      const aktiv = !!(window.__osBereiche && window.__osBereiche.aktiv === 'team')
      try { durchlaufen(document, 'top', aktiv ? d : null) } catch (e) {}
    }
    lauf()
    const iv = setInterval(lauf, 700)
    window.addEventListener('os-darstellung', lauf); window.addEventListener('os-bereiche', lauf); window.addEventListener('os-bereich', lauf)
    return () => { weg = true; clearInterval(iv); window.removeEventListener('os-darstellung', lauf); window.removeEventListener('os-bereiche', lauf); window.removeEventListener('os-bereich', lauf) }
  }, [uid])
  return null
}
