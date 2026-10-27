/* Hilfe im Bereich Verwalto (eingebettete Seiten): erklärende Hinweistexte werden ausgeblendet und gesammelt.
   Der Knopf „Hilfe“ oben rechts im OS-Rahmen zeigt sie zusammen mit der Anleitung an.
   Im Bereich „Eric“ bleibt alles wie bisher. Wird vom OS-Rahmen in jede eingebettete Seite geladen. */
(function () {
  if (window.__osHilfe) return; window.__osHilfe = true
  const lies = k => { try { return localStorage.getItem(k) || '' } catch (e) { return '' } }
  const datei = location.pathname.split('/').pop()
  if (datei === 'os-anleitungen.html') return

  const css = document.createElement('style')
  css.textContent = 'html.os-hilfe-kurz:not(.os-hilfe-zeigen) .os-erl{display:none!important}'
  ;(document.head || document.documentElement).appendChild(css)
  const html = document.documentElement
  const stand = () => { html.classList.toggle('os-hilfe-kurz', lies('os_bereich') !== 'eric'); html.classList.toggle('os-hilfe-zeigen', lies('os_hilfe_zeigen') === '1') }
  stand()
  window.addEventListener('storage', e => { if (e.key === 'os_bereich' || e.key === 'os_hilfe_zeigen') stand() })

  /* Erläuterungen erkennen: längere, erklärende Hinweistexte ohne Bedienelemente, Links und Beträge */
  const KANDIDAT = '.sub,.hint,.hinweis,.note,.info,.erkl,p.muted,.muted,small,.desc,.beschreibung'
  const AUS = 'td,th,.toast,#toast,[role=alert],.warnbox,.warn,.err,.error,.fehler,.bad,.ok,.pill,button,a,.kpi,.v,.leer,.empty,option,summary,h1,h2,h3,h4'
  const TEXTE = new Map()
  function pruefe(el) {
    if (el.__osErl !== undefined) return
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
    const ja = t.length >= 60 && t.split(' ').length >= 8 && !/€|EUR\b/.test(t) && !el.closest(AUS) &&
      !el.querySelector('input,select,textarea,button,a,table,img,canvas,video') && /[a-zäöüß]/.test(t)
    el.__osErl = ja
    if (ja) { el.classList.add('os-erl'); if (!TEXTE.has(t)) TEXTE.set(t, 1) }
  }
  let geplant = false
  function scan() { geplant = false; try { document.querySelectorAll(KANDIDAT).forEach(pruefe) } catch (e) {} }
  new MutationObserver(() => { if (!geplant) { geplant = true; setTimeout(scan, 120) } }).observe(html, { childList: true, subtree: true })
  scan()

  // für den Hilfe-Knopf im OS-Rahmen
  window.__osHilfeTexte = () => { scan(); return [...new Set([].concat(Array.isArray(window.OS_HILFE_HINWEISE) ? window.OS_HILFE_HINWEISE : [], [...TEXTE.keys()]))] }
  window.__osHilfeSeite = () => datei + location.search
})()
