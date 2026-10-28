/* Umsätze direkt von der Bank in die Buchungen übernehmen.
   Gleiche Regeln wie „Zahlungen abrufen“ in den Buchungen: Umsätze, die schon da sind (aus Nahaus oder CSV), werden nur verknüpft, nicht doppelt angelegt.
   Genutzt von Monatswechsel-Fixkosten und Bankkonten.  Aufruf: await osBankUmsaetze(sb, {von, info}) */
(function () {
  if (window.osBankUmsaetze) return
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim()
  function hashStr(s) { let h1 = 0x811c9dc5, h2 = 0x1b873593; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822507) } return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) }
  const addTage = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
  const tage = (a, b) => Math.abs((new Date(a) - new Date(b)) / 864e5)
  function gleich(a, u) {
    if (Math.abs((a.b || 0) - u.b) > 0.005) return false; if (tage(a.d, u.d) > 3) return false
    const na = norm(a.n || ''), nu = norm(u.n || ''); if (!na || !nu) return true
    const wa = na.split(' ').filter(w => w.length > 2), wu = nu.split(' ').filter(w => w.length > 2)
    return wa.some(w => wu.includes(w)) || na.slice(0, 6) === nu.slice(0, 6) || norm(a.z || '').includes(nu.split(' ')[0] || '#')
  }
  async function bank(sb, body) {
    let tok = ''; try { const { data } = await sb.auth.getSession(); tok = (data && data.session && data.session.access_token) || '' } catch (e) {}
    let r; try { r = await fetch('/api/bank', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify(body) }) } catch (e) { throw new Error('Bankanbindung nicht erreichbar.') }
    let j = null; try { j = await r.json() } catch (e) {}
    if (!j) throw new Error('Bankanbindung nicht erreichbar (' + r.status + ').'); if (j.error) throw new Error(j.error); return j
  }
  async function eins(sb, pfad) { const { data, error } = await sb.from('os_docs').select('data').eq('app', 'oc').eq('pfad', pfad).maybeSingle(); if (error) throw error; return data ? data.data : null }
  async function schreiben(sb, pfad, data) { const { error } = await sb.from('os_docs').upsert({ app: 'oc', pfad, data, updated_at: new Date().toISOString() }, { onConflict: 'app,pfad' }); if (error) throw error }

  window.osBankUmsaetze = async function (sb, opt) {
    opt = opt || {}; const info = opt.info || (() => {})
    info('Lade Konten …')
    const konten = ((await eins(sb, 'stamm/konten')) || {}).konten || []
    const bk = (await bank(sb, { aktion: 'konten', mitSaldo: false })).konten || []
    const inBank = new Set(bk.map(k => k.iban))
    const L = konten.filter(k => k.iban && inBank.has(k.iban))
    /* vorhandene Buchungen aller Konten */
    const buch = {}; let from = 0
    for (;;) { const { data, error } = await sb.from('os_docs').select('pfad,data').eq('app', 'oc').like('pfad', 'buchungen/%').range(from, from + 499); if (error) throw error
      for (const r of data || []) if (r.data && r.data.konto) buch[r.pfad.slice(10)] = r.data
      if (!data || data.length < 500) break; from += 500 }
    const heute = new Date().toISOString().slice(0, 10), min = addTage(heute, -85), E = []; let neu = 0, verkn = 0
    for (let i = 0; i < L.length; i++) {
      const k = L[i], key = k.key || k.iban; info('Rufe Umsätze ab: ' + (k.name || k.iban) + ' (' + (i + 1) + ' von ' + L.length + ') …')
      try {
        let letzte = ''; for (const d of Object.values(buch)) if (d.konto === key) for (const t of (d.tx || [])) if (t.d > letzte) letzte = t.d
        let seit = letzte ? addTage(letzte, -10) : min; if (seit < min) seit = min
        const U = ((await bank(sb, { aktion: 'umsaetze', iban: k.iban, seit })).umsaetze || []).sort((a, b) => a.d < b.d ? -1 : 1)
        const docs = {}; for (const [id, d] of Object.entries(buch)) if (d.konto === key) docs[id] = { tx: (d.tx || []).map(t => Object.assign({}, t)), neu: false, geaendert: false, monat: d.monat }
        const alle = []; for (const [id, o] of Object.entries(docs)) o.tx.forEach(t => alle.push({ id, t }))
        const bekannt = new Set(alle.flatMap(a => [a.t.x, a.t.xb]).filter(Boolean)); let n = 0, v = 0
        for (const u of U) { if (!u.d || bekannt.has(u.x)) continue
          let treffer = alle.find(a => !a.t.xb && !String(a.t.x || '').startsWith('eb:') && gleich(a.t, u))
          if (!treffer) { const K = alle.filter(a => !a.t.xb && !String(a.t.x || '').startsWith('eb:') && Math.abs((a.t.b || 0) - u.b) < 0.005 && tage(a.t.d, u.d) <= 1); if (K.length === 1) treffer = K[0] }
          if (treffer) { treffer.t.xb = u.x; docs[treffer.id].geaendert = true; bekannt.add(u.x); v++; continue }
          const mon = u.d.slice(0, 7), id = key + '_' + mon; if (!docs[id]) docs[id] = { tx: [], neu: true, geaendert: false, monat: mon }
          const t = { h: hashStr('eb|' + u.x), d: u.d, b: u.b, n: u.n, z: u.z, i: u.i, x: u.x, q: 'bank' }
          docs[id].tx.push(t); docs[id].geaendert = true; alle.push({ id, t }); bekannt.add(u.x); n++ }
        for (const [id, o] of Object.entries(docs)) { if (!o.geaendert) continue
          /* kurz vor dem Speichern frisch lesen, damit gleichzeitige Änderungen (z. B. Konto zugeordnet) erhalten bleiben */
          const frisch = await eins(sb, 'buchungen/' + id); const basis = frisch && frisch.konto ? frisch : { konto: key, monat: o.monat, tx: [] }
          const tx = (basis.tx || []).map(t => Object.assign({}, t)); const idx = new Map(tx.map((t, j) => [t.h, j]))
          for (const t of o.tx) { const j = idx.get(t.h); if (j == null) tx.push(t); else if (t.xb && !tx[j].xb) tx[j].xb = t.xb }
          tx.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0)
          const data = Object.assign({}, basis, { tx }); await schreiben(sb, 'buchungen/' + id, data); buch[id] = data }
        neu += n; verkn += v; E.push({ k: key, name: k.name, quelle: 'bank', neu: n, verkn: v, seit })
      } catch (e) { E.push({ k: key, name: k.name, quelle: 'bank', fehler: e.message || String(e) }) }
    }
    /* Stand für die Buchungen merken (Konten, die nur über Nahaus laufen, bleiben unverändert) */
    const am = new Date().toISOString()
    try { const alt = (await eins(sb, 'stamm/nahaussync')) || {}; const neuK = new Set(E.map(x => x.k))
      /* „am“ bleibt der letzte vollständige Abruf der Buchungen (inkl. Nahaus-Konten), damit dort der automatische Abruf weiter läuft */
      await schreiben(sb, 'stamm/nahaussync', Object.assign({}, alt, { am: alt.am || am, bankAm: am, bankVon: opt.von || '', konten: (alt.konten || []).filter(x => !neuK.has(x.k)).concat(E) })) } catch (e) {}
    return { am, neu, verkn, konten: E, fehler: E.filter(x => x.fehler) }
  }
})()
