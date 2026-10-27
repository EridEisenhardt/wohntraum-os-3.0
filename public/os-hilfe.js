/* Hilfe im Bereich Verwalto: Erläuterungstexte der Seite werden ausgeblendet und gesammelt.
   Ein kleiner Knopf „Hilfe“ unten rechts öffnet ein Fenster mit der Anleitung zu diesem Bereich,
   dem Link zum Video und allen Hinweisen der Seite. Im Bereich „Eric“ bleibt alles wie bisher.
   Wird vom OS-Rahmen (AppShell) in jede eingebettete Seite geladen. */
(function () {
  if (window.__osHilfe) return; window.__osHilfe = true
  let bereich = ''
  try { bereich = localStorage.getItem('os_bereich') || '' } catch (e) {}
  if (bereich !== 'team') return

  const SEITEN = {
    'anschreiben.html': 'anschreiben', 'buchhaltung-buchungen.html': 'buchungen', 'belegmaske.html': 'dokumente',
    'gerichtsfaelle.html': 'gericht-anwalt-inkasso', 'hv-dienstleister.html': 'kontakte', 'personal-lohnkosten.html': 'lohnkosten',
    'hv-mieterkonten.html': 'mieterkonten', 'mahngenerator.html': 'mahnungen', 'controlling-monatswechsel-fixkosten.html': 'monatswechsel-fixkosten',
    'controlling-objekt-controlling.html': 'objekt-controlling', 'os-objekte.html': 'objekte', 'os-objekt.html': 'objekte', 'hv-objekt.html': 'objekte',
    'hv-offene-mieten.html': 'offene-mieten', 'personal-akte.html': 'personalakten', 'zahlungsvereinbarung.html': 'ratenzahlung',
    'zahlungsvereinbarung-register.html': 'ratenzahlungen', 'hv-stoerungen.html': 'stoerungsmeldungen', 'hv-vertraege.html': 'vertraege',
    'zustaendigkeiten.html': 'zustaendigkeiten', 'os-fuhrpark.html': 'fahrzeuge', 'os-neuvermietung.html': 'neuvermietung',
    'os-gesellschaften.html': 'gesellschaften', 'hv-uebergaben.html': 'uebergabeprotokolle', 'os-postfach.html': 'postfach',
    'os-prozesslandkarte.html': 'prozesslandkarte', 'os-vertragsvorlagen.html': 'vertragsvorlagen', 'vm-mietangebot.html': 'mietangebot',
    'os-cliq.html': 'cliq', 'vm-selbstauskuenfte.html': 'selbstauskuenfte'
  }
  const datei = location.pathname.split('/').pop()
  if (datei === 'os-anleitungen.html') return
  let slug = SEITEN[datei] || ''
  if (datei === 'hv-mieterkonten.html' && /mahnlauf=1/.test(location.search)) slug = 'mahnlaeufe'

  let zeigen = false
  try { zeigen = localStorage.getItem('os_hilfe_zeigen') === '1' } catch (e) {}

  const css = document.createElement('style')
  css.textContent =
    'html:not(.os-hilfe-zeigen) .os-erl{display:none!important}' +
    '#os-hilfe-btn{position:fixed;right:14px;bottom:14px;z-index:2147483000;font:600 12.5px system-ui,-apple-system,"Segoe UI",sans-serif;padding:6px 12px;border-radius:999px;border:1px solid #d5dbe3;background:#fff;color:#2f5d8a;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08)}' +
    '#os-hilfe-btn:hover{border-color:#2f5d8a}' +
    '#os-hilfe-ov{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#os-hilfe-box{background:#fff;color:#18202c;border-radius:14px;max-width:720px;width:100%;max-height:86vh;overflow:auto;padding:18px 22px;box-shadow:0 20px 60px rgba(0,0,0,.3);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#os-hilfe-box h3{margin:0 0 8px;font-size:17px}#os-hilfe-box h4{margin:14px 0 4px;font-size:12px;color:#5f6b7a;text-transform:uppercase;letter-spacing:.04em}' +
    '#os-hilfe-box ol,#os-hilfe-box ul{padding-left:20px;margin:0}#os-hilfe-box li{margin:3px 0}' +
    '#os-hilfe-box .k{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px}#os-hilfe-box button{font:inherit;border:1px solid #d5dbe3;background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}' +
    '#os-hilfe-box button.p{background:#2f5d8a;color:#fff;border-color:#2f5d8a}#os-hilfe-box .m{color:#5f6b7a;font-size:13px}' +
    '@media (prefers-color-scheme: dark){#os-hilfe-btn{background:#1a1f28;border-color:#2b323e;color:#8db4dc}#os-hilfe-box{background:#1a1f28;color:#e5e9ef}#os-hilfe-box button{background:#222935;color:#e5e9ef;border-color:#2b323e}#os-hilfe-box .m,#os-hilfe-box h4{color:#97a1af}}'
  document.head.appendChild(css)
  if (zeigen) document.documentElement.classList.add('os-hilfe-zeigen')

  /* Erläuterungen erkennen: längere, erklärende Hinweistexte ohne Bedienelemente und ohne Beträge */
  const KANDIDAT = '.sub,.hint,.hinweis,.note,.info,.erkl,p.muted,.muted,small,.desc,.beschreibung'
  const AUS = 'td,th,.toast,#toast,[role=alert],.warnbox,.warn,.err,.error,.fehler,.bad,.ok,.pill,button,a,#os-hilfe-box,.kpi,.v,.leer,.empty,option,summary,h1,h2,h3,h4'
  const TEXTE = new Map()
  function pruefe(el) {
    if (el.__osErl !== undefined) return
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
    let ja = t.length >= 60 && t.split(' ').length >= 8 && !/€|EUR\b/.test(t) && !el.closest(AUS) &&
      !el.querySelector('input,select,textarea,button,a,table,img,canvas,video') && /[a-zäöüß]/.test(t)
    el.__osErl = ja
    if (ja) { el.classList.add('os-erl'); if (!TEXTE.has(t)) TEXTE.set(t, 1) }
  }
  let geplant = false
  function scan() { geplant = false; try { document.querySelectorAll(KANDIDAT).forEach(pruefe) } catch (e) {} }
  const plane = () => { if (!geplant) { geplant = true; setTimeout(scan, 120) } }
  new MutationObserver(plane).observe(document.documentElement, { childList: true, subtree: true })
  scan()

  /* Knopf und Fenster */
  let ANL = null
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  function knopf() {
    if (document.getElementById('os-hilfe-btn') || !document.body) return
    const b = document.createElement('button'); b.id = 'os-hilfe-btn'; b.type = 'button'; b.textContent = 'Hilfe'
    b.addEventListener('click', oeffnen); document.body.appendChild(b)
  }
  async function oeffnen() {
    if (!ANL) { try { ANL = await (await fetch('/anleitungen/anleitungen.json', { cache: 'no-cache' })).json() } catch (e) { ANL = [] } }
    scan()
    const a = (ANL || []).find(x => x.slug === slug)
    let h = '<h3>' + esc(a ? a.titel : (document.title || 'Hilfe')) + '</h3>'
    if (a) {
      h += '<div>' + esc(a.wofuer) + '</div>'
      if (a.schritte && a.schritte.length) h += '<h4>So arbeitest du damit</h4><ol>' + a.schritte.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>'
      if (a.tipps && a.tipps.length) h += '<h4>Gut zu wissen</h4><ul>' + a.tipps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>'
    }
    const L = [...TEXTE.keys()]
    if (L.length) h += '<h4>Hinweise auf dieser Seite</h4><ul>' + L.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>'
    if (!a && !L.length) h += '<div class="m">Für diese Seite gibt es noch keine Anleitung.</div>'
    h += '<div class="k">' + (a ? '<button class="p" data-h="video">' + (a.video ? 'Anleitung mit Video öffnen' : 'Anleitung öffnen') + '</button>' : '<button class="p" data-h="alle">Alle Anleitungen</button>') +
      '<button data-h="zeigen">' + (document.documentElement.classList.contains('os-hilfe-zeigen') ? 'Hinweise auf der Seite ausblenden' : 'Hinweise auf der Seite einblenden') + '</button>' +
      '<button data-h="zu" style="margin-left:auto">Schließen</button></div>'
    let ov = document.getElementById('os-hilfe-ov')
    if (!ov) { ov = document.createElement('div'); ov.id = 'os-hilfe-ov'; document.body.appendChild(ov)
      ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove() })
      ov.addEventListener('click', e => { const k = e.target.closest('[data-h]'); if (!k) return; const w = k.dataset.h
        if (w === 'zu') { ov.remove(); return }
        if (w === 'zeigen') { const an = !document.documentElement.classList.contains('os-hilfe-zeigen'); document.documentElement.classList.toggle('os-hilfe-zeigen', an); try { localStorage.setItem('os_hilfe_zeigen', an ? '1' : '0') } catch (er) {} ov.remove(); return }
        const ziel = '/verwalto/anleitungen' + (w === 'video' && slug ? '?bereich=' + encodeURIComponent(slug) : '')
        try { (window.top || window).location.href = ziel } catch (er) { location.href = ziel } }) }
    ov.innerHTML = '<div id="os-hilfe-box">' + h + '</div>'
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const ov = document.getElementById('os-hilfe-ov'); if (ov) ov.remove() } })
  if (document.body) knopf(); else document.addEventListener('DOMContentLoaded', knopf)
  // Wechsel in den Bereich „Eric“: alles wieder wie vorher
  window.addEventListener('storage', e => { if (e.key !== 'os_bereich' || e.newValue === 'team') return
    document.documentElement.classList.add('os-hilfe-zeigen'); const b = document.getElementById('os-hilfe-btn'); if (b) b.remove() })
})()
