/* Verträge im einheitlichen Wohntraum-Design erstellen (Wohntraum OS)
   Eine Vorlage ist Text mit einfachen Formatierungen und Platzhaltern:
     # Titel                     ## Abschnitt (§ ...)          ### Zwischenüberschrift
     Leerzeile = neuer Absatz    1. / 1.1. / (1) / a) = nummerierter Absatz mit Einzug
     - Aufzählung                [x] / [ ] Ankreuzfeld           >> rechtsbündige Zeile
     | a | b |  Tabellenzeile    |# a | b |  Kopfzeile           |=30,70|  Spaltenbreiten in Prozent
     **fett**                    ---seite  Seitenumbruch
     {quelle}                    Wert aus dem OS (siehe QUELLEN)
     {text:Bezeichnung|Vorgabe}  freier Text, wird vor dem Versenden im OS ausgefüllt
     {feld:rolle:Bezeichnung}    Feld, das der Unterzeichner in DocuSign selbst ausfüllt
     ?{quelle} ...               Zeile nur, wenn der Wert vorhanden ist (z. B. ?{mieter2_name})
     :::unterschriften mieter=Gast, vermieter=Beherberger   Unterschriftenblock (DocuSign)
   Benötigt jsPDF (window.jspdf). */
(function (G) {
  const p2 = n => String(n).padStart(2, '0')
  const dmy = s => { const x = String(s || '').slice(0, 10); return /^\d{4}-\d\d-\d\d$/.test(x) ? x.split('-').reverse().join('.') : String(s || '') }
  const zahl = v => { if (typeof v === 'number') return v; const x = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isNaN(x) ? 0 : Math.round(x * 100) / 100 }
  const betrag = n => (Number(n) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  function worte(n) {
    n = Math.floor(Math.abs(Number(n) || 0)); if (n === 0) return 'null'
    const E = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn']
    const Z = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig']
    const bis99 = x => x < 20 ? E[x] : (x % 10 ? E[x % 10] + 'und' : '') + Z[Math.floor(x / 10)]
    const bis999 = x => (x >= 100 ? E[Math.floor(x / 100)] + 'hundert' : '') + bis99(x % 100)
    let s = ''
    if (n >= 1e6) { const m = Math.floor(n / 1e6); s += (m === 1 ? 'eine Million ' : bis999(m) + ' Millionen '); n %= 1e6 }
    if (n >= 1000) { s += bis999(Math.floor(n / 1000)) + 'tausend'; n %= 1000 }
    s += bis999(n)
    return (s.endsWith('ein') ? s + 's' : s).trim()
  }

  const QUELLEN = [
    ['alle_mieter', 'Alle Mieter (Namen)'], ['besichtigung', 'Besichtigung am'], ['betriebskosten_zahl', 'Betriebskosten (Betrag)'],
    ['einheit', 'Einheit (z. B. WE 2)'], ['garage_zahl', 'Garage / Stellplatz (Betrag)'], ['gesamtmiete_zahl', 'Gesamtmiete (Betrag)'],
    ['heizkosten_zahl', 'Heizkosten (Betrag)'], ['heute', 'Heutiges Datum'], ['kaltmiete_worte', 'Kaltmiete in Worten'], ['kaltmiete_zahl', 'Kaltmiete (Betrag)'],
    ['kaution_worte', 'Kaution in Worten'], ['kaution_zahl', 'Kaution (Betrag)'], ['lage', 'Lage / Geschoss'], ['mietbeginn', 'Mietbeginn'],
    ['mieter_anrede_name', 'Mieter 1: Anrede und Name'], ['mieter_anschrift', 'Mieter 1: bisherige Anschrift'], ['mieter_email', 'Mieter 1: E-Mail'],
    ['mieter_geburtsdatum', 'Mieter 1: Geburtsdatum'], ['mieter_name', 'Mieter 1: Name'], ['mieter_telefon', 'Mieter 1: Telefon'], ['mieter2_name', 'Mieter 2: Name'],
    ['moebel_ebk_zahl', 'Möblierung und Einbauküche (Betrag)'], ['nebenkosten_zahl', 'Nebenkosten gesamt (BK, Heizung, Strom, WLAN)'],
    ['objekt_adresse', 'Objekt: Adresse'], ['objekt_adresse_we', 'Objekt: Adresse mit Einheit'], ['objekt_kz', 'Objekt: Kürzel'],
    ['personen', 'Personen (Zahl)'], ['personen_text', 'Personen (z. B. 2 Personen)'], ['strom_zahl', 'Strom (Betrag)'],
    ['vermieter', 'Vermieter: Name'], ['vermieter_anschrift', 'Vermieter: Anschrift'], ['vertragsdatum', 'Vertragsdatum (heute)'],
    ['verwendungszweck', 'Verwendungszweck Miete'], ['wlan_zahl', 'WLAN (Betrag)'], ['wohnflaeche', 'Wohnfläche (m²)'], ['zimmer', 'Zimmer']]

  // Werte aus Karte (Neuvermietung), Selbstauskunft, Objekt und Einheit
  function werte({ karte, msa, objekt, einheit, vermieter, vermieterAnschrift }) {
    const k = karte || {}, c = k.kalk || {}, pos = c.pos || {}, d = msa || {}, o = objekt || {}, e = einheit || {}
    const pw = p => { const v = zahl((pos[p] || {}).neu); return p === 'hausmeister' ? -Math.abs(v) : v }
    const kalt = pw('kalt'), bk = pw('bk'), hk = pw('hk'), strom = pw('strom'), wlan = pw('wlan'), garage = pw('garage'), moebel = pw('moebel'), ebk = pw('ebk'), hm = pw('hausmeister')
    const gesamt = Math.round((kalt + bk + hk + strom + wlan + garage + moebel + ebk + hm) * 100) / 100
    const kaution = c.kaution != null && c.kaution !== '' ? zahl(c.kaution) : kalt * 3
    const name1 = [k.vorname, k.name].filter(Boolean).join(' ')
    const weitere = String(k.weitere || '').split(/\s*,\s*/).filter(Boolean)
    const adr = [o.strasse || o.name, [o.plz, o.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    const heute = (x => p2(x.getDate()) + '.' + p2(x.getMonth() + 1) + '.' + x.getFullYear())(new Date())
    const pers = Number(k.personen) || (1 + weitere.length)
    const wfl = zahl(c.wfl) || zahl(e.flaeche)
    return {
      alle_mieter: [name1].concat(weitere).filter(Boolean).join(', '), besichtigung: dmy(d.besichtigung || ''),
      betriebskosten_zahl: betrag(bk), einheit: e.bezeichnung || '', garage_zahl: betrag(garage), gesamtmiete_zahl: betrag(gesamt),
      heizkosten_zahl: betrag(hk), heute, kaltmiete_zahl: betrag(kalt), kaltmiete_worte: worte(kalt), kaution_zahl: betrag(kaution), kaution_worte: worte(kaution),
      lage: c.lage || e.lage || '', mietbeginn: dmy(c.beginn || ''), mieter_anrede_name: [k.anrede && k.anrede !== 'Familie' ? k.anrede : '', name1].filter(Boolean).join(' '),
      mieter_anschrift: k.anschrift || d.adresse || '', mieter_email: k.email || d.email || '', mieter_geburtsdatum: dmy(d.geburtsdatum || ''), mieter_name: name1,
      mieter_telefon: k.tel || d.telefon || '', mieter2_name: weitere[0] || '', moebel_ebk_zahl: betrag(moebel + ebk),
      nebenkosten_zahl: betrag(bk + hk + strom + wlan), objekt_adresse: adr, objekt_adresse_we: adr + (e.bezeichnung ? ', ' + e.bezeichnung : ''), objekt_kz: o.kz || '',
      personen: String(pers), personen_text: pers + (pers === 1 ? ' Person' : ' Personen'), strom_zahl: betrag(strom),
      vermieter: vermieter || '', vermieter_anschrift: vermieterAnschrift || '',
      vertragsdatum: heute, verwendungszweck: ['Miete', o.kz, e.bezeichnung, k.name].filter(Boolean).join(' '), wlan_zahl: betrag(wlan),
      wohnflaeche: wfl ? String(wfl).replace('.', ',') : '', zimmer: e.zimmer ? String(e.zimmer).replace('.', ',') : ''
    }
  }
  const BEISPIEL = {
    karte: { vorname: 'Max', name: 'Muster', anrede: 'Herr', email: 'max.muster@beispiel.de', tel: '0151 1234567', personen: '1', anschrift: 'Musterweg 1, 55276 Oppenheim',
      kalk: { beginn: '2026-11-01', wfl: '62,5', pos: { kalt: { neu: 520 }, bk: { neu: 110 }, hk: { neu: 70 }, strom: { neu: 30 }, wlan: { neu: 15 } } } },
    msa: { geburtsdatum: '1990-05-04', besichtigung: '2026-10-15' }, objekt: { kz: 'K28', strasse: 'Musterstraße 28', plz: '55276', ort: 'Oppenheim' },
    einheit: { bezeichnung: 'WE 2', lage: '1. OG', flaeche: 62.5, zimmer: 2 }, vermieter: 'Eric Eisenhardt', vermieterAnschrift: 'Dalheimer Straße 70, 55278 Dexheim'
  }

  // Freie Texte und Unterzeichner-Felder einer Vorlage (für die Eingabe im OS)
  function freieTexte(text, V) {
    const L = [], seen = new Set()
    for (const zeile of zeilenAktiv(text, V)) for (const m of zeile.matchAll(/\{text:([^}|]+)(?:\|([^}]*))?\}/g)) { const l = m[1].trim(); if (!seen.has(l)) { seen.add(l); L.push({ label: l, vorgabe: (m[2] || '').replace(/;/g, '\n') }) } }
    return L
  }
  function zeilenAktiv(text, V) {
    return String(text || '').replace(/\r/g, '').split('\n').filter(z => { const m = z.match(/^\?\{(\w+)\}/); return !m || String(V[m[1]] || '').trim() !== '' }).map(z => z.replace(/^\?\{\w+\}\s*/, ''))
  }
  function rollenIn(text, V) {
    const R = new Set()
    for (const z of zeilenAktiv(text, V)) {
      const u = z.match(/^:::unterschriften\s*(.*)$/); if (u) for (const t of u[1].split(',')) { const r = t.split('=')[0].trim(); if (r === 'mieter') { R.add('mieter1'); if (V.mieter2_name) R.add('mieter2') } else if (r) R.add(r) }
      for (const m of z.matchAll(/\{feld:(\w+):/g)) R.add(m[1])
    }
    return [...R]
  }

  // ---------- PDF erstellen ----------
  // opt: {titel, kopf, fuss, vorschau, start: vorhandenes jsPDF-Dokument zum Anhängen}
  function erstellen(text, V, T, opt = {}) {
    const { jsPDF } = G.jspdf
    const neu = !opt.start
    const doc = opt.start || new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    if (!neu) doc.addPage()
    const startSeite = doc.getNumberOfPages()
    const L = 22, R = 188, B = R - L, TOP = 27, BOT = 274
    const INK = [24, 32, 44], MUT = [95, 107, 122], AKZ = [47, 93, 138], LINE = [200, 207, 216]
    const FS = 9.5, LH = 4.35
    let y = TOP
    const felder = [] // DocuSign-Textfelder {rolle, anker, label}
    let feldNr = 0
    const ersetzen = s => String(s).replace(/\{(text|feld):([^}]*)\}|\{(\w+)\}/g, (m, art, rest, q) => {
      if (q) return V[q] != null && V[q] !== '' ? String(V[q]) : (opt.vorschau ? '[' + q + ']' : '')
      if (art === 'text') { const [l, v] = rest.split('|'); const t = T && T[l.trim()]; return t != null && String(t).trim() !== '' ? String(t) : (v != null && v !== '' ? v.replace(/;/g, ', ') : '____________________') }
      const [rolle, label] = rest.split(':'); feldNr++; const anker = '/f' + feldNr + '_' + rolle + '/'
      felder.push({ rolle, anker, label: (label || 'Feld').trim() }); return '\u0001' + anker + '\u0002'
    })
    const neueSeite = () => { doc.addPage(); y = TOP }
    const platz = h => { if (y + h > BOT) neueSeite() }
    const font = b => doc.setFont('helvetica', b ? 'bold' : 'normal')
    // Text mit **fett** in Wörter zerlegen
    const woerter = s => {
      const out = []; let fett = false
      for (const teil of String(s).split('**')) { for (const w of teil.split(/(\s+)/)) if (w) out.push({ w, b: fett, sp: /^\s+$/.test(w) }); fett = !fett }
      return out
    }
    // Absatz setzen; gibt Höhe zurück. zeichnen=false nur messen
    function absatz(s, x, breite, size, zeichnen, farbe) {
      const W = woerter(s); doc.setFontSize(size); const lh = size * 0.4583
      const zeilen = []; let z = [], zb = 0
      for (const t of W) {
        if (t.w.includes('\u0001')) { t.feld = true }
        font(t.b); const tw = t.feld ? 70 : doc.getTextWidth(t.w)
        if (t.sp) { if (z.length) { z.push(Object.assign({}, t, { tw })); zb += tw } continue }
        if (zb + tw > breite && z.length) { while (z.length && z[z.length - 1].sp) { zb -= z.pop().tw } zeilen.push(z); z = []; zb = 0 }
        z.push(Object.assign({}, t, { tw })); zb += tw
      }
      if (z.length) zeilen.push(z)
      if (zeichnen) {
        let yy = y
        for (const zl of zeilen) {
          if (yy + lh > BOT) { neueSeite(); yy = y }
          let xx = x
          for (const t of zl) {
            if (t.feld) {
              const anker = t.w.replace(/[\u0001\u0002]/g, '')
              doc.setDrawColor(...MUT); doc.setLineWidth(0.2); doc.line(xx, yy + 1, xx + 68, yy + 1)
              doc.setTextColor(255, 255, 255); doc.setFontSize(5); font(false); doc.text(anker, xx + 0.5, yy - 0.5); doc.setFontSize(size)
              if (opt.vorschau) { doc.setTextColor(...AKZ); doc.setFontSize(6.5); const f = felder.find(f => f.anker === anker); doc.text('füllt ' + ({ mieter1: 'Mieter 1', mieter2: 'Mieter 2', vermieter: 'Vermieter' }[f && f.rolle] || '') + ' in DocuSign aus', xx + 1, yy - 0.2); doc.setFontSize(size) }
            } else if (!t.sp) { font(t.b); doc.setTextColor(...(farbe || INK)); doc.text(t.w, xx, yy) }
            xx += t.tw
          }
          yy += lh
        }
        y = yy
      }
      return zeilen.length * lh
    }
    function tabelle(zeilen, breiten) {
      const n = Math.max(...zeilen.map(z => z.zellen.length))
      const bw = (breiten && breiten.length === n ? breiten : Array(n).fill(100 / n)).map(p => B * p / 100)
      for (const z of zeilen) {
        // Höhe messen
        let h = 0
        z.zellen.forEach((c, i) => { const yy = y; const hh = absatz(c, 0, bw[i] - 3, FS - 0.5, false); y = yy; h = Math.max(h, hh) })
        h += 2.6
        platz(h)
        let x = L
        if (z.kopf) { doc.setFillColor(238, 241, 245); doc.rect(L, y, B, h, 'F') }
        doc.setDrawColor(...LINE); doc.setLineWidth(0.2)
        for (let i = 0; i < n; i++) {
          doc.rect(x, y, bw[i], h)
          const yy = y; y = y + 3.6; absatz(z.kopf ? '**' + (z.zellen[i] || '') + '**' : (z.zellen[i] || ''), x + 1.5, bw[i] - 3, FS - 0.5, true); y = yy
          x += bw[i]
        }
        y += h
      }
      y += 2.5
    }
    function unterschriften(arg) {
      const rollen = []
      for (const t of arg.split(',')) {
        const [r, lab] = t.split('=').map(s => s && s.trim()); if (!r) continue
        if (r === 'mieter') { rollen.push(['mieter1', (lab || 'Mieter') + (V.mieter2_name ? ' 1' : ''), V.mieter_name]); if (V.mieter2_name) rollen.push(['mieter2', (lab || 'Mieter') + ' 2', V.mieter2_name]) }
        else rollen.push([r, lab || (r === 'vermieter' ? 'Vermieter' : r), r === 'vermieter' ? V.vermieter : ''])
      }
      const bw = 78, gap = B - 2 * bw
      for (let i = 0; i < rollen.length; i += 2) {
        platz(34); y += 14
        for (let j = 0; j < 2 && i + j < rollen.length; j++) {
          const [r, lab, name] = rollen[i + j], x = L + j * (bw + gap)
          doc.setTextColor(255, 255, 255); doc.setFontSize(5); font(false); doc.text('/u_' + r + '/', x + 1, y - 7)
          if (opt.vorschau) { doc.setDrawColor(...AKZ); doc.setLineWidth(0.2); doc.setLineDashPattern([1, 1], 0); doc.rect(x, y - 12, 60, 11); doc.setLineDashPattern([], 0); doc.setTextColor(...AKZ); doc.setFontSize(7); doc.text('Unterschrift über DocuSign', x + 2, y - 5) }
          doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(x, y, x + bw, y)
          doc.setTextColor(...INK); doc.setFontSize(8.5); font(true); doc.text(lab + (name ? ': ' + name : ''), x, y + 4.2)
          font(false); doc.setTextColor(...MUT); doc.setFontSize(8); doc.text('Datum:', x, y + 8.6)
          doc.setTextColor(255, 255, 255); doc.setFontSize(5); doc.text('/d_' + r + '/', x + 11, y + 8.6)
          if (opt.vorschau) { doc.setTextColor(...AKZ); doc.setFontSize(7); doc.text('wird von DocuSign eingetragen', x + 11, y + 8.6) }
        }
        y += 16
      }
    }

    // ---------- Zeilen verarbeiten ----------
    const Z = zeilenAktiv(text, V)
    let tab = null, breiten = null
    const tabEnde = () => { if (tab) { tabelle(tab, breiten); tab = null; breiten = null } }
    for (let i = 0; i < Z.length; i++) {
      let z = Z[i].trimEnd()
      if (/^\|=/.test(z)) { tabEnde(); breiten = z.replace(/^\|=|\|$/g, '').split(',').map(Number); tab = []; continue }
      if (/^\|/.test(z)) { if (!tab) tab = []; const kopf = /^\|#/.test(z); tab.push({ kopf, zellen: z.replace(/^\|#?|\|$/g, '').split('|').map(c => ersetzen(c.trim())) }); continue }
      tabEnde()
      if (!z.trim()) continue
      if (z === '---seite') { neueSeite(); continue }
      if (/^:::unterschriften/.test(z)) { unterschriften(z.replace(/^:::unterschriften\s*/, '')); continue }
      if (/^# /.test(z)) { platz(16); doc.setTextColor(...INK); doc.setFontSize(16); font(true); const t = ersetzen(z.slice(2)); for (const zl of doc.splitTextToSize(t, B)) { doc.text(zl, L, y + 4); y += 7 } doc.setDrawColor(...AKZ); doc.setLineWidth(0.6); doc.line(L, y, L + 30, y); y += 7; continue }
      if (/^## /.test(z)) { platz(16); y += 2.5; absatz('**' + ersetzen(z.slice(3)) + '**', L, B, 11, true, AKZ); y += 1.2; continue }
      if (/^### /.test(z)) { platz(12); y += 1; absatz('**' + ersetzen(z.slice(4)) + '**', L, B, FS, true); y += 0.6; continue }
      if (/^>> /.test(z)) { platz(6); doc.setFontSize(8.5); font(false); doc.setTextColor(...MUT); doc.text(ersetzen(z.slice(3)), R, y, { align: 'right' }); y += LH + 1.5; continue }
      let m
      if ((m = z.match(/^\[( |x|X)\]\s+(.*)$/))) {
        platz(LH + 1); doc.setDrawColor(...INK); doc.setLineWidth(0.25); doc.rect(L, y - 2.9, 3.2, 3.2)
        if (m[1] !== ' ') { doc.setLineWidth(0.4); doc.line(L + 0.6, y - 2.3, L + 2.6, y - 0.3); doc.line(L + 2.6, y - 2.3, L + 0.6, y - 0.3) }
        absatz(ersetzen(m[2]), L + 6, B - 6, FS, true); y += 1.8; continue
      }
      if ((m = z.match(/^- (.*)$/))) {
        const inhalt = m[1]
        const tm = inhalt.match(/^\{text:([^}|]+)(?:\|([^}]*))?\}$/)
        const punkte = tm ? (() => { const t = T && T[tm[1].trim()]; const v = t != null && String(t).trim() !== '' ? String(t) : (tm[2] || ''); return v.split(/\n|;/).map(s => s.trim()).filter(Boolean) })() : [ersetzen(inhalt)]
        for (const p of punkte) { platz(LH); doc.setTextColor(...INK); doc.setFontSize(FS); font(false); doc.text('•', L + 2, y); absatz(p, L + 7, B - 7, FS, true); y += 0.8 }
        y += 0.8; continue
      }
      if ((m = z.match(/^((?:\d+\.)+\d*|\(\d+\)|[a-z]\)|[IVX]+\.)\s+(.*)$/))) {
        const nr = m[1]; doc.setFontSize(FS); font(false); const ein = Math.max(8, doc.getTextWidth(nr) + 2.5)
        platz(LH); doc.setTextColor(...INK); doc.text(nr, L, y); absatz(ersetzen(m[2]), L + ein, B - ein, FS, true); y += 1.8; continue
      }
      // normaler Absatz (Folgezeilen ohne Leerzeile gehören dazu)
      let s = z
      while (i + 1 < Z.length && Z[i + 1].trim() && !/^(#|\||\[|- |>> |:::|---seite|\?\{)/.test(Z[i + 1]) && !/^((?:\d+\.)+\d*|\(\d+\)|[a-z]\)|[IVX]+\.)\s/.test(Z[i + 1])) { s += ' ' + Z[++i].trim() }
      platz(LH); absatz(ersetzen(s), L, B, FS, true); y += 1.8
    }
    tabEnde()

    // Kopf- und Fußzeile auf den Seiten dieses Vertrags
    const ende = doc.getNumberOfPages(), anz = ende - startSeite + 1
    for (let p = startSeite; p <= ende; p++) {
      doc.setPage(p)
      doc.setDrawColor(...AKZ); doc.setLineWidth(0.5); doc.line(L, 14, R, 14)
      doc.setTextColor(...INK); doc.setFontSize(8.5); font(true); doc.text(opt.kopf || V.vermieter || '', L, 11.5)
      font(false); doc.setTextColor(...MUT); doc.setFontSize(7.5); doc.text(V.vermieter_anschrift || '', L + doc.getTextWidth(opt.kopf || V.vermieter || '') * 8.5 / 7.5 + 3, 11.5)
      doc.text(opt.titel || '', R, 11.5, { align: 'right' })
      doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(L, 283, R, 283)
      doc.setFontSize(7.5); doc.text([opt.titel, opt.fuss].filter(Boolean).join(' · '), L, 287)
      doc.text('Seite ' + (p - startSeite + 1) + ' von ' + anz, R, 287, { align: 'right' })
    }
    doc.setPage(ende)
    return { doc, felder }
  }

  // DocuSign: Unterzeichner mit Feldern (Anker). rollen: {mieter1:{name,email}, ...}
  function unterzeichner(rollen, felder) {
    const reihenfolge = { mieter1: 1, mieter2: 1, vermieter: 2 }
    let id = 0
    return Object.entries(rollen).filter(([, p]) => p && p.email).map(([r, p]) => {
      id++
      const anker = (s, x, yy) => ({ anchorString: s, anchorUnits: 'mms', anchorXOffset: String(x), anchorYOffset: String(yy), anchorIgnoreIfNotPresent: 'true' })
      return {
        email: p.email, name: p.name, recipientId: String(id), routingOrder: String(reihenfolge[r] || 1), roleName: r,
        tabs: {
          signHereTabs: [anker('/u_' + r + '/', -1, -2)],
          dateSignedTabs: [Object.assign(anker('/d_' + r + '/', 0, -2.5), { font: 'helvetica', fontSize: 'size9' })],
          textTabs: felder.filter(f => f.rolle === r).map(f => Object.assign(anker(f.anker, 0, -3.5), { tabLabel: f.label, width: '190', height: '14', required: 'false', font: 'helvetica', fontSize: 'size9' }))
        }
      }
    })
  }

  G.VertragPdf = { erstellen, werte, freieTexte, rollenIn, unterzeichner, worte, betrag, QUELLEN, BEISPIEL, zeilenAktiv }
})(typeof window !== 'undefined' ? window : globalThis)
