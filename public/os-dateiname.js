/* Dateinamen nach dem Wohntraum-Schema für Dokumente zu Mietern:
   Objekt_Wohneinheit_NACHNAME Vorname_JJJJ-MM-TT_Beschreibung  (z. B. M8_WE1_LAMB Sascha_2026-09-23_Mietvertrag.pdf) */
(function (w) {
  const p2 = n => String(n).padStart(2, '0')
  const heute = () => { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) }
  const safe = s => String(s || '').replace(/[\\/:*?"<>|#%]/g, '_').replace(/\s+/g, ' ').trim()
  // „WE 1.1“ → „WE1.1“, „we3 zi 8“ → „WE3.8“, sonst Leerzeichen entfernen (EFH, G1 …)
  function einheit(s) {
    s = String(s || '').trim(); if (!s) return ''
    const m = s.match(/^we\s*(\d+)(?:\s*(?:[.\s]|\s*zi\.?\s*)\s*(\d+)(?!\d))?(.*)$/i)
    if (m) return ('WE' + m[1] + (m[2] ? '.' + m[2] : '') + m[3]).replace(/\s+/g, '')
    return s.replace(/\s+/g, '')
  }
  // „Kai Esser“, „Esser, Kai“, „Herr Kai Esser“ → „ESSER Kai“ (bei mehreren Mietern der erste)
  function person(nachname, vorname) {
    if (vorname != null || (nachname && !/\s|,/.test(String(nachname).trim()))) {
      return [String(nachname || '').trim().toUpperCase(), String(vorname || '').trim()].filter(Boolean).join(' ')
    }
    let n = String(nachname || '').split(/\s+(?:&|und|\/)\s+|;/)[0].trim().replace(/^(herrn?|frau|eheleute|familie|fam\.)\s+/i, '')
    if (n.includes(',')) { const [a, b] = n.split(','); return person(a.trim(), b.trim()) }
    const t = n.split(/\s+/).filter(Boolean); if (!t.length) return ''
    if (t.length === 1) return t[0].toUpperCase()
    return t[t.length - 1].toUpperCase() + ' ' + t.slice(0, -1).join(' ')
  }
  // o = { kz, einheit, name | nachname + vorname, datum (JJJJ-MM-TT), thema, endung }
  function mieter(o) {
    const nv = o.nachname != null || o.vorname != null ? person(o.nachname, o.vorname || '') : person(o.name)
    const teile = [o.kz, einheit(o.einheit), nv, String(o.datum || heute()).slice(0, 10), o.thema].map(x => safe(x)).filter(Boolean)
    return teile.join('_') + (o.endung === '' ? '' : (o.endung || '.pdf'))
  }
  w.OsDateiname = { mieter, person, einheit, safe, heute }
})(window)
