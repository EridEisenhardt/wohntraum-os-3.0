/* Mietangebote: füllt die Original-Vorlagen der Ämter (PDF) mit den Daten aus der Mietkalkulation.
   Die Vorlagen selbst bleiben unverändert: Formularfelder werden nur befüllt, bei Vorlagen ohne Felder
   wird der Text an die vorgesehenen Stellen geschrieben. Benötigt pdf-lib (window.PDFLib oder require). */
(function (wurzel) {
  const lib = () => (typeof PDFLib !== 'undefined' ? PDFLib : wurzel.PDFLib || (typeof require === 'function' ? require('pdf-lib') : null))

  // Vorlagen: Datei liegt im Speicher (Bucket „vertraege“), hochladen über die Seite Vertragsvorlagen
  const VORLAGEN = [
    { id: 'jc_alzey_worms', name: 'Jobcenter Alzey-Worms – Zusicherung, Mietkaution und Wohnungsangebot', kurz: 'Jobcenter Alzey-Worms', gebiet: /^Alzey-Worms|^Stadt Worms/ },
    { id: 'kreis_bad_kreuznach', name: 'Kreis Bad Kreuznach – Anlage 2 Angemessenheit der Unterkunft', kurz: 'Bad Kreuznach Anlage 2', gebiet: /Kreuznach/ },
    { id: 'kreis_mainz_bingen', name: 'Kreis Mainz-Bingen – Mietbescheinigung', kurz: 'Mainz-Bingen Mietbescheinigung', gebiet: /^Mainz-Bingen/ },
    { id: 'sozialamt_alzey_worms', name: 'Sozialamt Alzey-Worms – Wohnungsangebot', kurz: 'Sozialamt Alzey-Worms', gebiet: null }
  ].map(v => Object.assign(v, { datei: 'mietangebot-vorlagen/' + v.id + '.pdf' }))

  // Zusätzliche Angaben, die nicht in der Kalkulation stehen (je nach gewählter Vorlage)
  const FRAGEN = [
    { key: 'ort_datum', label: 'Ort, Datum', vorlagen: ['jc_alzey_worms', 'kreis_bad_kreuznach', 'kreis_mainz_bingen', 'sozialamt_alzey_worms'] },
    { key: 'bg_nummer', label: 'BG-Nummer / Aktenzeichen', vorlagen: ['jc_alzey_worms', 'kreis_bad_kreuznach', 'kreis_mainz_bingen', 'sozialamt_alzey_worms'] },
    { key: 'baujahr', label: 'Baujahr / Jahr der Bezugsfertigkeit', vorlagen: ['jc_alzey_worms', 'kreis_bad_kreuznach', 'kreis_mainz_bingen'] },
    { key: 'zimmer', label: 'Anzahl Zimmer', vorlagen: ['jc_alzey_worms', 'kreis_mainz_bingen'] },
    { key: 'kuechen', label: 'Anzahl Küchen', vorgabe: '1', vorlagen: ['jc_alzey_worms'] },
    { key: 'baeder', label: 'Anzahl Bäder', vorgabe: '1', vorlagen: ['jc_alzey_worms'] },
    { key: 'heizungsart', label: 'Heizungsart', vorgabe: 'Gas', liste: ['Gas', 'Öl', 'Fernwärme', 'Strom', 'Wärmepumpe', 'Holz / Pellets'], vorlagen: ['jc_alzey_worms', 'kreis_bad_kreuznach', 'kreis_mainz_bingen'] },
    { key: 'warmwasser', label: 'Warmwasser', vorgabe: 'zentral über die Heizung', liste: ['zentral über die Heizung', 'dezentral (Boiler / Durchlauferhitzer)'], vorlagen: ['jc_alzey_worms', 'kreis_bad_kreuznach', 'kreis_mainz_bingen', 'sozialamt_alzey_worms'] },
    { key: 'kochfeuerung', label: 'Kochfeuerung', vorgabe: 'Strom', liste: ['Strom', 'Gas'], vorlagen: ['kreis_bad_kreuznach'] },
    { key: 'geschoss', label: 'Geschoss', liste: ['EG', 'OG', 'DG'], vorlagen: ['kreis_mainz_bingen'] },
    { key: 'einbaukueche', label: 'Einbauküche vorhanden', liste: ['ja', 'nein'], vorlagen: ['kreis_mainz_bingen'] },
    { key: 'moebliert', label: 'Möbliert', liste: ['ja', 'nein'], vorlagen: ['kreis_mainz_bingen'] },
    { key: 'garage_pflicht', label: 'Anmietung Garage / Stellplatz verpflichtend', vorgabe: 'nein', liste: ['ja', 'nein'], vorlagen: ['kreis_bad_kreuznach'] },
    { key: 'renovierung', label: 'Wohnung renovierungsbedürftig', vorgabe: 'nein', liste: ['ja', 'nein'], vorlagen: ['sozialamt_alzey_worms'] },
    { key: 'kaution_darlehen', label: 'Darlehen für die Mietkaution beantragen', vorgabe: 'ja', liste: ['ja', 'nein'], vorlagen: ['jc_alzey_worms'] }
  ]
  const VERMIETER = { name: 'Eric Eisenhardt', anschrift: 'Dalheimer Straße 70, 55278 Dexheim', ort: 'Dexheim', telefon: '06133-9382937' }

  const zahl = v => { if (typeof v === 'number') return v; const s = String(v == null ? '' : v).trim().replace(/\s|€/g, ''); return Number(/,/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s) || 0 }
  const eur = n => { n = zahl(n); if (!n) return ''; const [g, k] = Math.abs(n).toFixed(2).split('.'); return (n < 0 ? '-' : '') + g.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + k }
  const ja = v => /^(ja|true|1|zentral)/i.test(String(v || ''))
  const p2 = n => String(n).padStart(2, '0')
  const heute = () => { const d = new Date(); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear() }

  // Vorschlag nach Gebiet der Kalkulation
  function vorschlag(gebiet) { const g = String(gebiet || ''); return VORLAGEN.filter(v => v.gebiet && v.gebiet.test(g)).map(v => v.id) }
  function fragenFuer(ids) { return FRAGEN.filter(f => f.vorlagen.some(id => ids.includes(id))) }

  // Daten zusammenstellen. D = { vorname, nachname, anschrift (bisher), personen, mietbeginn (TT.MM.JJJJ), wohnung (Anschrift mit WE), lage,
  //   wfl, kalt, bk, hk, strom, wlan, garage, moebel, ebk, gesamt, kaution, objekt_kz, einheit }, A = Antworten der Fragen
  function aufbereiten(D, A) {
    const a = Object.assign({}, A || {})
    if (!a.baujahr && D.baujahr) a.baujahr = String(D.baujahr)
    if (!a.heizungsart && D.heizungsart) a.heizungsart = String(D.heizungsart)
    if (!a.ort_datum) a.ort_datum = VERMIETER.ort + ', ' + heute()
    FRAGEN.forEach(f => { if ((a[f.key] == null || a[f.key] === '') && f.vorgabe) a[f.key] = f.vorgabe })
    if (!a.zimmer && D.zimmer) a.zimmer = String(D.zimmer)
    if (!a.einbaukueche) a.einbaukueche = zahl(D.ebk) ? 'ja' : 'nein'
    if (!a.moebliert) a.moebliert = zahl(D.moebel) ? 'ja' : 'nein'
    if (!a.geschoss) { const l = String(D.lage || '').toUpperCase(); a.geschoss = /DG|DACH/.test(l) ? 'DG' : /EG|ERDG|PARTERRE/.test(l) ? 'EG' : /OG/.test(l) ? 'OG' : '' }
    const adr = String(D.anschrift || '').trim(), i = adr.lastIndexOf(',')
    return Object.assign({}, D, a, {
      name_nv: [String(D.nachname || '').toUpperCase(), D.vorname].filter(Boolean).join(' '),
      name_kv: [D.nachname, D.vorname].filter(Boolean).join(', '),
      name_vn: [D.vorname, D.nachname].filter(Boolean).join(' '),
      adr1: i > 0 ? adr.slice(0, i).trim() : adr, adr2: i > 0 ? adr.slice(i + 1).trim() : '',
      ww_zentral: /^zentral/i.test(a.warmwasser || ''), heute: heute()
    })
  }

  // ---------- Werkzeuge ----------
  function formular(doc) {
    const f = doc.getForm()
    const feld = n => { try { return f.getField(n) } catch (e) { return null } }
    return {
      text(n, w) { const x = feld(n); if (x && x.setText) x.setText(String(w == null ? '' : w)) },
      // nur befüllen, wenn die Vorlage dort nichts stehen hat
      leer(n, w) { const x = feld(n); if (x && x.setText && !String(x.getText() || '').trim()) x.setText(String(w == null ? '' : w)) },
      kreuz(n, an) { const x = feld(n); if (x && x.check) an ? x.check() : x.uncheck() },
      fertig(font) { try { f.updateFieldAppearances(font) } catch (e) {} }
    }
  }
  function zeichner(doc, font) {
    const P = doc.getPages(), { rgb } = lib(), farbe = rgb(0.05, 0.1, 0.35)
    return {
      // x, y: Grundlinie von oben gemessen (Punkt)
      // rechts = true: x ist der rechte Rand (für Beträge vor dem €-Zeichen)
      text(s, x, y, w, groesse, b, rechts) {
        w = String(w == null ? '' : w); if (!w) return; const p = P[s - 1], h = p.getHeight(); let g = groesse || 10
        if (b) while (g > 6 && font.widthOfTextAtSize(w, g) > b) g -= 0.5
        p.drawText(w, { x: rechts ? x - font.widthOfTextAtSize(w, g) : x, y: h - y, size: g, font, color: farbe })
      },
      // Kreuz in ein Kästchen, x/y = linke obere Ecke, k = Kantenlänge
      kreuz(s, x, y, an, k) { if (!an) return; k = k || 7; const p = P[s - 1], h = p.getHeight(), o = 1.2
        p.drawLine({ start: { x: x + o, y: h - y - o }, end: { x: x + k - o, y: h - y - k + o }, thickness: 1.1, color: farbe })
        p.drawLine({ start: { x: x + o, y: h - y - k + o }, end: { x: x + k - o, y: h - y - o }, thickness: 1.1, color: farbe }) },
      async bild(s, x, y, b, daten) { if (!daten) return; const p = P[s - 1], h = p.getHeight(); let im
        try { im = daten[0] === 0x89 ? await doc.embedPng(daten) : daten[0] === 0xff ? await doc.embedJpg(daten) : null } catch (e) { im = null }
        if (!im) return; const f = b / im.width
        p.drawImage(im, { x, y: h - y - im.height * f, width: b, height: im.height * f }) }
    }
  }

  // ---------- Befüllen je Vorlage ----------
  const FUELLEN = {
    async jc_alzey_worms(doc, V, Z) {
      const F = formular(doc), anschrift = V.wohnung, bg = String(V.bg_nummer || '').replace(/^\s*52704\s*\/\/\s*00\s*/, '')
      // Eigenanteil Strom / WLAN in die Lücken der Notiz auf Seite 4
      Z.text(4, 355.5, 288, zahl(V.strom) ? eur(V.strom) : '', 7, 30, true); Z.text(4, 436.5, 288, zahl(V.wlan) ? eur(V.wlan) : '', 7, 30, true)
      // Seite 1: Antrag auf Zusicherung
      F.text('BG-Nummer', bg); F.text('Name_Antragsteller', V.name_vn); F.text('Adresse 1', V.adr1); F.text('Adresse 2', V.adr2)
      F.text('Betrag', V.anschrift_ort || V.adr2); F.text('Betrag_2', anschrift)
      F.kreuz('Markierfeld 1', true); F.kreuz('Markierfeld 1_4', ja(V.kaution_darlehen)); F.kreuz('Markierfeld 1_2', false); F.kreuz('Markierfeld 1_3', false)
      // Seite 3: Darlehen Mietkaution
      const dl = ja(V.kaution_darlehen)
      F.text('BG-Nummer_2', dl ? bg : ''); F.text('Name_Antragsteller_2', dl ? V.name_vn : ''); F.text('Adresse 1_2', dl ? V.adr1 : ''); F.text('Adresse 2_2', dl ? V.adr2 : '')
      F.text('Textfeld 3_2', dl ? anschrift : ''); F.text('Textfeld 4', dl ? eur(V.kaution) : '')
      F.text('Textfeld 5_5', dl ? [V.objekt_kz, V.einheit, 'Kaution', V.nachname].filter(Boolean).join(' ') : ''); F.text('Textfeld 4_2', V.ort_datum)
      // Seite 4: Wohnungsangebot
      F.text('Datum Antragstellung', V.name_nv); F.text('Textfeld 2', V.personen); F.text('Textfeld 3_3', V.mietbeginn); F.text('Textfeld 6', anschrift)
      F.text('Datum Antragstellung_7', String(V.wfl || '').replace('.', ','))
      F.text('Datum Antragstellung_8', eur(V.kalt)); F.text('Datum Antragstellung_9', eur(V.hk)); F.text('Datum Antragstellung_10', eur(V.bk))
      F.kreuz('Markierfeld 1_5', false); F.kreuz('Markierfeld 1_6', true); F.text('Datum Antragstellung_11', '')
      F.text('Datum Antragstellung_12', eur(V.garage))
      F.text('Datum Antragstellung_2', V.zimmer); F.text('Datum Antragstellung_3', V.kuechen); F.text('Datum Antragstellung_4', V.baeder)
      F.text('Datum Antragstellung_5', V.baujahr); F.text('Datum Antragstellung_6', V.heizungsart)
      F.kreuz('Markierfeld 3', V.ww_zentral); F.kreuz('Markierfeld 3_2', !V.ww_zentral)
      return F
    },
    async kreis_mainz_bingen(doc, V) {
      const F = formular(doc), sonst = [zahl(V.strom) ? 'Strom ' + eur(V.strom) : '', zahl(V.wlan) ? 'WLAN ' + eur(V.wlan) : ''].filter(Boolean).join(' / ')
      F.text('Name Vorname Mietinteressent', V.name_kv); F.text('AzLSB Aktenzeichen', V.bg_nummer)
      F.text('aktueller Wohnort Straße Hausnummer Postleitzahl und Ort', V.anschrift)
      F.text('Anschrift der neuen Unterkunft Straße Hausnummer Postleitzahl und Ort', V.wohnung)
      F.text('Gesamtanzahl der Bewohner', V.personen); F.text('Bezug der neu angemieteten Wohnung am', V.mietbeginn)
      F.text('Euro', eur(V.kalt)); F.text('Euro_2', eur(V.bk)); F.text('Euro_3', eur(V.hk)); F.text('Euro_4', '')
      const h = String(V.heizungsart || '').toLowerCase()
      F.kreuz('Heizöl', /öl/.test(h)); F.kreuz('Erdgas', /gas/.test(h)); F.kreuz('Fernwärme', /fernw/.test(h)); F.kreuz('sonstiges', !!h && !/öl|gas|fernw/.test(h))
      F.kreuz('ja', !V.ww_zentral); F.kreuz('nein', V.ww_zentral)
      F.kreuz('ja_2', !!zahl(V.garage)); F.kreuz('nein_2', !zahl(V.garage)); F.text('Euro_5', eur(V.garage))
      const mb = zahl(V.moebel) + zahl(V.ebk)
      F.kreuz('ja_3', !!mb); F.kreuz('nein_3', !mb); F.text('Euro_6', eur(mb))
      F.text('Sonstige Kosten zB in Miete enthaltene Abschläge für Stromkosten', sonst); F.text('Euro_7', eur(zahl(V.strom) + zahl(V.wlan)))
      F.text('Euro_8', eur(V.gesamt)); F.kreuz('ja_4', false); F.kreuz('nein_4', true)
      F.text('Text1', V.baujahr); F.text('Die Wohnung wurde vom Antragsteller bezogen am', V.mietbeginn)
      F.text('Größe der Wohnung m²', String(V.wfl || '').replace('.', ',')); F.text('Anzahl der Zimmer', V.zimmer)
      F.kreuz('ja_5', ja(V.einbaukueche)); F.kreuz('nein_5', !ja(V.einbaukueche))
      F.kreuz('EG', V.geschoss === 'EG'); F.kreuz('OG', V.geschoss === 'OG'); F.kreuz('DG', V.geschoss === 'DG')
      F.kreuz('vollteilmöbliert', ja(V.moebliert)); F.text('Ort DatumRow1', V.ort_datum)
      F.leer('Name Vorname Vermieter', VERMIETER.name); F.leer('Anschrift Vermieter Straße Hausnummer PLZ Wohnort', VERMIETER.anschrift)
      return F
    },
    async kreis_bad_kreuznach(doc, V, Z) {
      Z.text(1, 82, 122, [V.name_vn, V.anschrift, V.bg_nummer ? 'BG ' + V.bg_nummer : ''].filter(Boolean).join(', '), 10, 420)
      Z.text(1, 82, 155, [V.wohnung, V.lage].filter(Boolean).join(', '), 10, 420)
      Z.text(1, 82, 183, [VERMIETER.name, VERMIETER.anschrift, 'Tel. ' + VERMIETER.telefon].join(', '), 10, 420)
      Z.text(1, 352, 266, V.personen, 10, 34)
      Z.text(1, 529, 290, eur(V.kalt), 10, 44, true)
      const g = zahl(V.garage), hk = !!zahl(V.hk), bk = !!zahl(V.bk)
      Z.text(1, 153, 323, g ? eur(g) : '', 9, 34, true)
      Z.kreuz(1, 336.5, 317, false, 6); Z.kreuz(1, 336.5, 329, !!g, 6)
      Z.kreuz(1, 347, 352.5, g && ja(V.garage_pflicht), 6); Z.kreuz(1, 347, 364.3, g && !ja(V.garage_pflicht), 6)
      Z.text(1, 527, 395, eur(V.hk), 10, 44, true)
      Z.text(1, 349, 429, V.heizungsart, 10, 50)
      Z.kreuz(1, 347, 445.8, hk, 6); Z.kreuz(1, 417, 445.8, hk, 6); Z.kreuz(1, 347, 457.6, !hk, 6)
      Z.kreuz(1, 347, 481.2, V.ww_zentral, 6); Z.kreuz(1, 347, 493, !V.ww_zentral, 6)
      Z.text(1, 349, 523, V.kochfeuerung, 10, 50)
      Z.text(1, 524, 560, eur(V.bk), 10, 42, true)
      Z.kreuz(1, 347, 575.5, bk, 6); Z.kreuz(1, 417, 575.5, bk, 6); Z.kreuz(1, 347, 599, !bk, 6)
      Z.text(1, 527, 619, eur(zahl(V.kalt) + zahl(V.hk) + zahl(V.bk)), 10, 44, true)
      Z.text(1, 349, 667, V.baujahr, 10, 50); Z.text(1, 349, 690, V.mietbeginn, 10, 50); Z.text(1, 349, 714, String(V.wfl || '').replace('.', ','), 10, 50)
      Z.text(1, 54, 759, V.ort_datum, 9, 220)
    },
    async sozialamt_alzey_worms(doc, V, Z, B) {
      Z.text(1, 410, 78, V.bg_nummer, 8, 95)
      Z.text(1, 71, 104, VERMIETER.name + ', ' + VERMIETER.anschrift, 9, 300)
      Z.text(1, 98, 190, V.name_vn, 10, 220)
      Z.text(1, 197, 218, V.personen, 10, 22); Z.text(1, 428, 218, V.mietbeginn, 10, 60)
      Z.text(1, 203, 245, V.wohnung, 10, 330)
      Z.text(1, 144, 273, String(V.wfl || '').replace('.', ','), 10, 30)
      Z.text(1, 169, 300, eur(V.kalt), 10, 28, true)
      Z.text(1, 169, 328, eur(V.bk), 9, 28, true); Z.text(1, 268, 328, eur(V.hk), 9, 28, true); Z.text(1, 349, 328, eur(V.strom), 9, 28, true); Z.text(1, 435, 328, eur(V.wlan), 9, 28, true)
      Z.kreuz(1, 249, 350, V.ww_zentral, 10); Z.kreuz(1, 321, 350, !V.ww_zentral, 10)
      Z.kreuz(1, 249, 377, ja(V.renovierung), 10); Z.kreuz(1, 321, 377, !ja(V.renovierung), 10)
      Z.kreuz(1, 144, 404, !!zahl(V.kaution), 10); Z.text(1, 269, 413, eur(V.kaution), 8, 28, true); Z.kreuz(1, 285, 404, !zahl(V.kaution), 10)
      Z.text(1, 88, 440, V.ort_datum, 10, 100)
    }
  }

  // Manche Vorlagen wurden nachträglich bearbeitet: die Seite zeigt neuere Feld-Objekte als das Formularverzeichnis.
  // Damit genau die sichtbaren Felder befüllt werden, wird das Verzeichnis aus den Feldern der Seiten neu aufgebaut.
  function felderAusSeiten(doc) {
    const L = lib(), { PDFName, PDFDict, PDFArray, PDFRef } = L, ctx = doc.context, refs = [], seen = new Set()
    const ac = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict); if (!ac) return
    for (const p of doc.getPages()) {
      const an = p.node.lookupMaybe(PDFName.of('Annots'), PDFArray); if (!an) continue
      for (let i = 0; i < an.size(); i++) {
        let r = an.get(i); if (!(r instanceof PDFRef)) continue
        let d = ctx.lookup(r, PDFDict); if (!d || String(d.get(PDFName.of('Subtype'))) !== '/Widget') continue
        let n = 0; while (d.get(PDFName.of('Parent')) && n++ < 10) { r = d.get(PDFName.of('Parent')); d = ctx.lookup(r, PDFDict) }
        if (!d.get(PDFName.of('T')) || seen.has(r.toString())) continue
        seen.add(r.toString()); refs.push(r)
      }
    }
    if (refs.length) ac.set(PDFName.of('Fields'), ctx.obj(refs))
  }

  // Eine Vorlage befüllen → Uint8Array (Formular bleibt bearbeitbar)
  async function ausfuellen(id, vorlageBytes, D, A, bilder) {
    const L = lib(), V = aufbereiten(D, A), doc = await L.PDFDocument.load(vorlageBytes)
    felderAusSeiten(doc)
    const font = await doc.embedFont(L.StandardFonts.Helvetica)
    const F = await FUELLEN[id](doc, V, zeichner(doc, font), bilder || {})
    if (F && F.fertig) F.fertig(font)
    return doc.save()
  }

  const api = { VORLAGEN, FRAGEN, VERMIETER, vorschlag, fragenFuer, aufbereiten, ausfuellen, eur }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  wurzel.MietangebotPdf = api
})(typeof window !== 'undefined' ? window : globalThis)
