'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { cssFuer, lokalLesen, lokalSetzen } from '@/lib/darstellung'

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
function durchlaufen(doc, art, d) {
  stil(doc, cssFuer(d, art))
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
