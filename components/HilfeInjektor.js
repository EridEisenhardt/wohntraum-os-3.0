'use client'
import { useEffect } from 'react'

// Lädt /os-hilfe.js in jede eingebettete OS-Seite (gleicher Ursprung). Die Hilfe selbst entscheidet,
// ob sie aktiv ist (nur im Bereich Verwalto).
const SRC = '/os-hilfe.js?v=20261027a'
function einbauen(f) {
  try {
    const w = f.contentWindow, d = f.contentDocument
    if (!w || !d || !d.head || d.getElementById('os-hilfe-js')) return
    if (!/\.html$/.test(w.location.pathname)) return
    const s = d.createElement('script'); s.id = 'os-hilfe-js'; s.src = SRC; d.head.appendChild(s)
  } catch (e) {}
}
export default function HilfeInjektor() {
  useEffect(() => {
    const pruefe = () => {
      document.querySelectorAll('iframe').forEach((f) => {
        if (!f.__osHilfe) { f.__osHilfe = true; f.addEventListener('load', () => einbauen(f)) }
        try { if (f.contentDocument && f.contentDocument.readyState !== 'loading') einbauen(f) } catch (e) {}
      })
    }
    pruefe()
    const iv = setInterval(pruefe, 1500)
    return () => clearInterval(iv)
  }, [])
  return null
}
