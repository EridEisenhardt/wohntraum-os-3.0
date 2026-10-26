'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

/* Globale Suche: Mieter, Objekte, Kontakte, Firmen, Mietinteressenten, Störungen, Fahrzeuge, Gesellschaften */
const normS = (t) => String(t || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/\s+/g, ' ')
let SUCHDATEN = null, SUCHSTAND = 0, SUCHLAEUFT = null
async function suchdatenLaden() {
  if (!supabase) return []
  if (SUCHDATEN && Date.now() - SUCHSTAND < 5 * 60e3) return SUCHDATEN
  if (SUCHLAEUFT) return SUCHLAEUFT
  SUCHLAEUFT = (async () => {
    const q = (p) => p.then((r) => (r && r.data) || []).catch(() => [])
    const heute = new Date().toISOString().slice(0, 10)
    const [mk, ob, ko, fi, ck, mi, st, fz, ge] = await Promise.all([
      q(supabase.from('os_docs').select('pfad,obj:data->>obj,einheit:data->>einheit,mieter:data->>mieter,bis:data->>bis').eq('app', 'oc').like('pfad', 'mietkonten/%')),
      q(supabase.from('obj_objekte').select('id,kz,name,strasse,plz,ort,status')),
      q(supabase.from('hv_kontakte').select('id,vorname,name,email,telefon,position')),
      q(supabase.from('hv_firmen').select('id,name,branche,telefon,ort')),
      q(supabase.from('crm_kontakte').select('id,vorname,name,email,telefon,ort')),
      q(supabase.from('mietinteressenten').select('id,vorname,name,kontakt,status,archiviert')),
      q(supabase.from('stoerungen').select('id,nr,titel,melder_name,status').order('created_at', { ascending: false }).limit(500)),
      q(supabase.from('fz_fahrzeuge').select('id,kennzeichen,modell,fahrer')),
      q(supabase.from('ges_gesellschaften').select('kuerzel,name,ort')),
    ])
    const L = []
    const add = (typ, label, sub, href, extra) => { if (label) L.push({ typ, label, sub: sub || '', href, text: normS([label, sub, extra].join(' ')) }) }
    mk.forEach((m) => add('Mieter', m.mieter, [m.obj, m.einheit].filter(Boolean).join(' ') + (m.bis && m.bis < heute ? ' · ausgezogen' : ''), '/hausverwaltung/mieterkonten?pid=' + encodeURIComponent(String(m.pfad).split('/')[1])))
    ob.forEach((o) => add('Objekt', o.kz + (o.strasse || o.name ? ' · ' + (o.strasse || o.name) : ''), [o.plz, o.ort].filter(Boolean).join(' ') + (o.status === 'Verkauft' ? ' · verkauft' : ''), '/verwalto/objekt?id=' + encodeURIComponent(o.id), o.name))
    ko.forEach((k) => add('Kontakt', [k.vorname, k.name].filter(Boolean).join(' '), [k.position, k.telefon, k.email].filter(Boolean).join(' · '), '/hausverwaltung/dienstleister?kontakt=' + encodeURIComponent(k.id)))
    fi.forEach((f) => add('Firma', f.name, [f.branche, f.ort, f.telefon].filter(Boolean).join(' · '), '/hausverwaltung/dienstleister?firma=' + encodeURIComponent(f.id)))
    ck.forEach((k) => add('CRM-Kontakt', [k.vorname, k.name].filter(Boolean).join(' '), [k.ort, k.telefon, k.email].filter(Boolean).join(' · '), '/crm'))
    mi.forEach((m) => add('Mietinteressent', [m.vorname, m.name].filter(Boolean).join(' ') || m.kontakt, [m.status, m.archiviert ? 'archiviert' : ''].filter(Boolean).join(' · '), '/vermietung/mietinteressenten?open=' + encodeURIComponent(m.id), m.kontakt))
    st.forEach((x) => add('Störung', (x.nr ? x.nr + ' · ' : '') + (x.titel || ''), [x.melder_name, x.status].filter(Boolean).join(' · '), '/hausverwaltung/stoerungen?id=' + encodeURIComponent(x.id)))
    fz.forEach((f) => add('Fahrzeug', f.kennzeichen, [f.modell, f.fahrer].filter(Boolean).join(' · '), '/verwalto/fuhrpark?id=' + encodeURIComponent(f.id)))
    ge.forEach((g) => add('Gesellschaft', g.kuerzel + ' · ' + (g.name || ''), g.ort || '', '/verwalto/gesellschaften?kz=' + encodeURIComponent(g.kuerzel)))
    SUCHDATEN = L; SUCHSTAND = Date.now(); SUCHLAEUFT = null; return L
  })()
  return SUCHLAEUFT
}

export const NAV = [
  { type: 'link', href: '/', icon: 'ti-layout-dashboard', label: 'Cockpit', exact: true, area: 'common' },
  { type: 'link', href: '/tools', icon: 'ti-layout-grid', label: 'Alle Tools', area: 'common' },
  // Bereich Verwalto: eigene Kategorien. Einträge mit "offen" sind Platzhalter für alle sichtbar,
  // alle anderen sind sichtbar, wenn die Seite (bzw. "perm") an ihrem bisherigen Platz im Menü sichtbar war.
  { type: 'link', href: '/verwalto/anleitungen', icon: 'ti-school', label: 'Anleitungen', area: 'common' },
  { type: 'group', key: 'v-buchhaltung', icon: 'ti-calculator', label: 'Buchhaltung', mod: 'verwalto', items: [
    { href: '/buchhaltung/buchungen', icon: 'ti-arrows-exchange', label: 'Buchungen' },
    { href: '/controlling/monatswechsel-fixkosten', icon: 'ti-calendar-check', label: 'Monatswechsel Fixkosten' },
    { href: '/betriebskosten', icon: 'ti-receipt-2', label: 'Betriebskostenabrechnung' },
    { href: '/controlling/objekt-controlling', icon: 'ti-building-bank', label: 'Objekt-Controlling' },
  ] },
  { type: 'group', key: 'v-dokumente', icon: 'ti-files', label: 'Dokumente erstellen', mod: 'verwalto', items: [
    { href: '/hausverwaltung/anschreiben', icon: 'ti-mail', label: 'Anschreiben' },
    { href: '/verwalto/dokumente', icon: 'ti-file', label: 'Dokumente', offen: true },
    { href: '/mahnprozess/generator', icon: 'ti-file-invoice', label: 'Mahnungen' },
    { href: '/vermietung/mietangebot', icon: 'ti-file-text', label: 'Mietangebot', perm: '/hausverwaltung/mieterkonten' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Ratenzahlung' },
    { href: '/verwalto/vertragsvorlagen', icon: 'ti-file-certificate', label: 'Vertragsvorlagen', offen: true },
  ] },
  { type: 'group', key: 'v-fuhrpark', icon: 'ti-car', label: 'Fuhrpark', mod: 'verwalto', items: [
    { href: '/verwalto/fuhrpark', icon: 'ti-car', label: 'Fahrzeuge', perm: '/hausverwaltung/mieterkonten' },
  ] },
  { type: 'group', key: 'v-hausverwaltung', icon: 'ti-home-cog', label: 'Hausverwaltung', mod: 'verwalto', items: [
    { href: '/verwalto/objekte', icon: 'ti-building-skyscraper', label: 'Objekte', perm: '/hausverwaltung/objekte' },
    { href: '/hausverwaltung/mieterkonten', icon: 'ti-users', label: 'Mieterkonten' },
    { href: '/verwalto/neuvermietung', icon: 'ti-key', label: 'Neuvermietung', offen: true },
    { href: '/vermietung/selbstauskuenfte', icon: 'ti-forms', label: 'Selbstauskünfte', offen: true },
    { href: '/hausverwaltung/stoerungen', icon: 'ti-tool', label: 'Störungsmeldungen', perm: '/hausverwaltung/objekte' },
    { href: '/hausverwaltung/uebergaben', icon: 'ti-clipboard-check', label: 'Übergabeprotokolle', perm: '/hausverwaltung/objekte' },
  ] },
  { type: 'group', key: 'v-mahnwesen', icon: 'ti-cash-off', label: 'Mahnwesen & Forderungen', mod: 'verwalto', items: [
    { href: '/hausverwaltung/offene-mieten', icon: 'ti-cash-off', label: 'Offene Mieten' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Ratenzahlungen' },
    { href: '/verwalto/mahnlaeufe', icon: 'ti-gavel', label: 'Mahnläufe', perm: '/hausverwaltung/mieterkonten' },
  ] },
  { type: 'group', key: 'v-personal', icon: 'ti-users-group', label: 'Personal', mod: 'verwalto', items: [
    { href: '/personal/lohnkosten', icon: 'ti-coin', label: 'Lohnkosten' },
    { href: '/personal/akte', icon: 'ti-folder', label: 'Personalakten' },
    { href: '/personal/zustaendigkeiten', icon: 'ti-list-check', label: 'Zuständigkeiten' },
  ] },
  { type: 'group', key: 'v-postfach', icon: 'ti-mail', label: 'Postfach', mod: 'verwalto', items: [
    { href: '/verwalto/cliq', icon: 'ti-messages', label: 'Cliq', perm: '/hausverwaltung/mieterkonten' },
    { href: '/verwalto/postfach', icon: 'ti-inbox', label: 'Postfach Hausverwaltung', perm: '/hausverwaltung/mieterkonten' },
  ] },
  { type: 'group', key: 'v-prozesslandkarte', icon: 'ti-folders', label: 'Prozesslandkarte 3.0', mod: 'verwalto', items: [
    { href: '/verwalto/prozesslandkarte', icon: 'ti-folder-open', label: 'Prozesslandkarte 3.0', offen: true },
  ] },
  { type: 'group', key: 'v-stammdaten', icon: 'ti-database', label: 'Stammdaten', mod: 'verwalto', items: [
    { href: '/hausverwaltung/dienstleister', icon: 'ti-address-book', label: 'Kontakte' },
    { href: '/verwalto/gesellschaften', icon: 'ti-building', label: 'Gesellschaften', perm: '/hausverwaltung/mieterkonten' },
  ] },
  { type: 'group', key: 'v-verwaltung', icon: 'ti-folders', label: 'Verwaltung', mod: 'verwalto', items: [
    { href: '/hausverwaltung/vertraege', icon: 'ti-file-certificate', label: 'Verträge' },
    { href: '/gerichtsfaelle', icon: 'ti-gavel', label: 'Gericht-Anwalt-Inkasso' },
  ] },
  { type: 'link', href: '/playbook', icon: 'ti-book-2', label: 'Playbook', area: 'common' },
  { type: 'group', key: 'gf-dashboard', icon: 'ti-chart-pie', label: 'GF-Dashboard', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/gf-dashboard', icon: 'ti-chart-pie', label: 'Übersicht' },
    { href: '/gf-dashboard/kpi', icon: 'ti-gauge', label: 'KPI GF · Cashflow je Struktur' },
  ] },
  { type: 'link', href: '/beschluesse', icon: 'ti-clipboard-check', label: 'Beschlüsse', area: ['vertrieb', 'hv'], mod: 'dashboards' },
  { type: 'group', key: 'backoffice', icon: 'ti-building-warehouse', label: 'Backoffice-Kosten', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/backoffice-kosten', icon: 'ti-cash-banknote', label: 'Backoffice-Kosten & Umlage je Wohneinheit' },
  ] },
  { type: 'group', key: 'buchhaltung', icon: 'ti-calculator', label: 'Buchhaltung', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/buchungen', icon: 'ti-arrows-exchange', label: 'Buchungen' },
    { href: '/controlling/monatswechsel-fixkosten', icon: 'ti-calendar-check', label: 'Monatswechsel Fixkosten' },
    { href: '/hausverwaltung/mieterkonten', icon: 'ti-users', label: 'Mieterkonten' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Ratenzahlung erstellen' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Ratenzahlungen' },
    { href: '/mahnprozess/generator', icon: 'ti-file-invoice', label: 'Mahnungen & Register' },
    { href: '/mahnprozess', icon: 'ti-gavel', label: 'Mahnprozess' },
    { href: '/controlling/liquiditaet', icon: 'ti-droplet', label: 'Liquidität verbessern' },
  ] },
  { type: 'group', key: 'hausverwaltung', icon: 'ti-home-cog', label: 'Hausverwaltung', area: ['hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/hausverwaltung/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/hausverwaltung/objekte', icon: 'ti-building-skyscraper', label: 'Objekte' },
    { href: '/betriebskosten', icon: 'ti-receipt-2', label: 'Betriebskostenabrechnung' },
    { href: '/hausverwaltung/einheiten', icon: 'ti-home', label: 'Einheiten' },
    { href: '/hausverwaltung/vertraege', icon: 'ti-file-certificate', label: 'Verträge' },
    { href: '/hausverwaltung/mieterkonten', icon: 'ti-users', label: 'Mieterkonten' },
    { href: '/hausverwaltung/leerstand', icon: 'ti-key', label: 'Leerstand' },
    { href: '/hausverwaltung/rangliste', icon: 'ti-trophy', label: 'Rangliste Objekte' },
    { href: '/hausverwaltung/offene-mieten', icon: 'ti-cash-off', label: 'Offene Mieten' },
    { href: '/portfolio', icon: 'ti-chart-dots-3', label: 'Portfolio (Faktor · Cashflow)' },
    { href: '/hausverwaltung/mietermeldungen', icon: 'ti-message-report', label: 'Mietermeldungen' },
    { href: '/hausverwaltung/dienstleister', icon: 'ti-address-book', label: 'Firmen & Dienstleister' },
    { href: '/hausverwaltung/anschreiben', icon: 'ti-mail', label: 'Anschreiben' },
    { href: '/vermietung/einzuege', icon: 'ti-door-enter', label: 'Einzüge' },
    { href: '/vermietung/mieteruebergaben', icon: 'ti-key', label: 'Mieterübergaben' },
    { href: '/vermietung/auszuege', icon: 'ti-door-exit', label: 'Auszüge' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Ratenzahlung erstellen' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Ratenzahlungen' },
    { href: '/gerichtsfaelle', icon: 'ti-gavel', label: 'Gericht-Anwalt-Inkasso' },
  ] },
  { type: 'link', href: '/hausmeisterdienst', icon: 'ti-tools', label: 'Übersicht', area: ['hv', 'backoffice'], mod: 'dashboards' },
  { type: 'group', key: 'assetmgmt-bh', icon: 'ti-building-bank', label: 'Assetmanagement', area: ['hv', 'backoffice'], mod: 'controlling', items: [
    { href: '/buchhaltung/assetmanagement', icon: 'ti-chart-arcs', label: 'Übersicht' },
    { href: '/buchhaltung/assetmanagement/input-portfolio', icon: 'ti-database-import', label: 'Input Portfolio' },
    { href: '/buchhaltung/assetmanagement/portfolio', icon: 'ti-building-community', label: 'Portfolio' },
    { href: '/buchhaltung/assetmanagement/entwicklungen', icon: 'ti-trending-up', label: 'Entwicklungen' },
    { href: '/buchhaltung/assetmanagement/zielentwicklung', icon: 'ti-target-arrow', label: 'Zielentwicklung in €' },
    { href: '/buchhaltung/assetmanagement/liquiditaet', icon: 'ti-cash', label: 'Liquidität' },
  ] },
  { type: 'group', key: 'assetmanagement', icon: 'ti-building-estate', label: 'Assetmanagement (Optimierung)', area: ['vertrieb', 'hv'], mod: 'dashboards', items: [
    { href: '/assetmanagement/einnahmenoptimierung', icon: 'ti-trending-up', label: 'Einnahmenoptimierung' },
    { href: '/assetmanagement/steueroptimierung', icon: 'ti-receipt-tax', label: 'Steueroptimierung' },
    { href: '/assetmanagement/mietoptimierung', icon: 'ti-home-dollar', label: 'Mietoptimierung' },
  ] },
  { type: 'group', key: 'strategie', icon: 'ti-chess', label: 'Strategie', area: 'vertrieb', mod: 'dashboards', items: [
    { href: '/strategie/veraenderungen', icon: 'ti-arrows-shuffle', label: 'Veränderungen in der Organisation' },
  ] },
  { type: 'group', key: 'baustandard', icon: 'ti-ruler-2', label: 'Baustandard', area: 'vertrieb', mod: 'dashboards', items: [
    { href: '/planung/baustandard', icon: 'ti-ruler-2', label: 'Baustandard' },
    { href: '/planung/materialliste', icon: 'ti-list-details', label: 'Materialliste' },
    { href: '/planung/kpi-sanierungen', icon: 'ti-chart-dots', label: 'KPI Sanierungen' },
    { href: '/planung/renovierungsliste', icon: 'ti-file-report', label: 'Renovierungs- und Sanierungsliste' },
  ] },
  { type: 'group', key: 'crm', icon: 'ti-address-book', label: 'CRM', area: ['vertrieb', 'hv'], mod: 'crm', items: [
    { href: '/crm', icon: 'ti-users', label: 'Kontakte & Deals' },
    { href: '/tickets', icon: 'ti-ticket', label: 'Ticketsystem' },
  ] },
  { type: 'link', href: '/aktivitaeten', icon: 'ti-checklist', label: 'Aktivitäten', area: 'hv', mod: 'aktivitaeten' },
  { type: 'group', key: 'ankauf', icon: 'ti-key', label: 'Ankauf', area: 'vertrieb', mod: 'ankauf', items: [
    { href: '/ankauf/akquise', icon: 'ti-map-search', label: 'Immobilien Akquise' },
    { href: '/ankauf/verkauf', icon: 'ti-cash-banknote', label: 'Immobilien Verkauf (Pipeline)' },
  ] },
  { type: 'group', key: 'vermietung', icon: 'ti-home-search', label: 'Vermietung', area: 'vertrieb', mod: 'vermietung', items: [
    { href: '/vermietung/selbstauskuenfte', icon: 'ti-forms', label: 'Selbstauskünfte' },
    { href: '/vermietung/mietinteressenten', icon: 'ti-users-plus', label: 'Mietinteressenten' },
    { href: '/vermietung/vermittler', icon: 'ti-affiliate', label: 'Vermittler-Übersicht' },
    { href: '/vermietung/wohnungsvermietung', icon: 'ti-home-cog', label: 'Wohnungsvermietung' },
    { href: '/vermietung/wohnungsvermietung-bpmn', icon: 'ti-hierarchy-2', label: 'Wohnungsvermietung · BPMN' },
    { href: '/vermietung/steckbrief', icon: 'ti-id-badge-2', label: 'Steckbrief Generator' },
    { href: '/vermietung/laufende-vermietungen', icon: 'ti-progress', label: 'Laufende Vermietungen' },
    { href: '/vermietung/zahlungsvereinbarung', icon: 'ti-file-dollar', label: 'Ratenzahlung erstellen' },
    { href: '/vermietung/zahlungsvereinbarung-register', icon: 'ti-receipt-2', label: 'Ratenzahlungen' },
  ] },
  { type: 'group', key: 'controlling', icon: 'ti-chart-histogram', label: 'Controlling', area: 'hv', mod: 'controlling', items: [
    { href: '/controlling/statistik', icon: 'ti-chart-bar', label: 'Statistik' },
    { href: '/controlling/xray', icon: 'ti-scan', label: 'xRay' },
    { href: '/controlling/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel (Controlling)' },
    { href: '/controlling/objekt-controlling', icon: 'ti-building-bank', label: 'Objekt-Controlling' },
  ] },
  { type: 'group', key: 'produktivitaet', icon: 'ti-rocket', label: 'Produktivität', area: 'hv', mod: 'produktivitaet', items: [
    { href: '/produktivitaet/tracking', icon: 'ti-chart-line', label: 'Tracking' },
    { href: '/produktivitaet/planung', icon: 'ti-calendar-event', label: 'Wochenplanung' },
    { href: '/produktivitaet/ideale-woche', icon: 'ti-calendar-heart', label: 'Ideale Woche' },
    { href: '/produktivitaet/statusbericht', icon: 'ti-clipboard-check', label: 'Statusbericht GF' },
    { href: '/produktivitaet/dokumentnamen', icon: 'ti-file-text', label: 'Dokumentennamen-Generator' },
    { href: '/produktivitaet/stundengehalt', icon: 'ti-clock-dollar', label: 'Stundengehalt' },
    { href: '/produktivitaet/gpm-tracker', icon: 'ti-target-arrow', label: 'GPM-Tracker' },
    { href: '/produktivitaet/not-to-do', icon: 'ti-ban', label: 'Not-To-Do & Delegieren' },
  ] },
  { type: 'group', key: 'finance', icon: 'ti-cash', label: 'Finance', area: 'hv', mod: 'finance', items: [
    { href: '/finance/input', icon: 'ti-forms', label: 'Input' },
    { href: '/finance/darlehen', icon: 'ti-businessplan', label: 'Darlehen' },
    { href: '/finance/darlehensregister', icon: 'ti-list-numbers', label: 'Darlehensregister' },
    { href: '/finance/darlehensgenerator', icon: 'ti-calculator', label: 'Darlehensgenerator' },
    { href: '/finance/zinsberechnung', icon: 'ti-percentage', label: 'Zinsberechnung' },
    { href: '/finance/selbstauskunft', icon: 'ti-user-search', label: 'Selbstauskunft für die Bank' },
    { href: '/finance/reporting', icon: 'ti-report-analytics', label: 'Reporting für die Bank' },
    { href: '/portfolio', icon: 'ti-chart-dots-3', label: 'Portfolio-Report (Faktor · Cashflow)' },
    { href: '/finance/steuer-bilanz', icon: 'ti-receipt-tax', label: 'Steuer und Bilanzunterlagen' },
    { href: '/finance/liquiditaetsplanung', icon: 'ti-wallet', label: 'Liquiditätsplanung' },
    { href: '/finance/monatswechsel', icon: 'ti-calendar-dollar', label: 'Monatswechsel (Finance)' },
  ] },
  { type: 'group', key: 'prozesse', icon: 'ti-sitemap', label: 'Prozesse', area: ['vertrieb', 'hv'], mod: 'produktivitaet', items: [
    { href: '/prozesse/bpmn', icon: 'ti-hierarchy-2', label: 'BPMN-Modellierung' },
  ] },
  { type: 'link', href: '/dokumente', icon: 'ti-files', label: 'Dokumente', area: 'common', mod: 'dokumente' },
  { type: 'link', href: '/dms', icon: 'ti-folders', label: 'DMS · Dokumentenverwaltung', area: 'common', mod: 'dokumente' },
  { type: 'group', key: 'wissensdatenbank', icon: 'ti-book', label: 'Wissensdatenbank', area: ['vertrieb', 'hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/wissensdatenbank', icon: 'ti-school', label: 'Schulungsplattform' },
    { href: '/wissensdatenbank/nummernsystem', icon: 'ti-hash', label: 'Nummernsystem' },
  ] },
  { type: 'group', key: 'stammdaten', icon: 'ti-database', label: 'Stammdaten', area: 'hv', mod: 'dokumente', items: [
    { href: '/stammdaten/kontakte', icon: 'ti-users', label: 'Kontakte' },
    { href: '/stammdaten/firmen', icon: 'ti-building', label: 'Firmen' },
  ] },
  { type: 'group', key: 'personal', icon: 'ti-users-group', label: 'Personal', area: ['hv', 'backoffice'], mod: 'personal', items: [
    { href: '/personal/zustaendigkeiten', icon: 'ti-list-check', label: 'Zuständigkeiten & SOPs' },
    { href: '/personal/akte', icon: 'ti-id', label: 'Personalakte' },
    { href: '/personal/lohnkosten', icon: 'ti-coin-euro', label: 'Lohnkosten' },
  ] },
  { type: 'group', key: 'eric-privat', icon: 'ti-user-heart', label: 'Eric Privat', area: ['vertrieb', 'hv'], mod: 'privat', items: [
    { href: '/eric-privat/zieleboard', icon: 'ti-target-arrow', label: 'Zieleboard' },
    { href: '/eric-privat/quartalsplanung', icon: 'ti-calendar-stats', label: 'Quartalsplanung' },
    { href: '/eric-privat/budgetplan', icon: 'ti-wallet', label: 'Budgetplan' },
    { href: '/eric-privat/idealer-tag', icon: 'ti-sun', label: 'Idealer Tag' },
    { href: '/eric-privat/entwicklung', icon: 'ti-stairs-up', label: 'Entwicklung' },
    { href: '/eric-privat/engpassanalyse', icon: 'ti-filter-cog', label: 'Engpassanalyse' },
    { href: '/eric-privat/vermoegensbilanz', icon: 'ti-scale', label: 'Vermögensbilanz' },
    { href: '/eric-privat/weiterbildung', icon: 'ti-school', label: 'Aus- und Fortbildung' },
    { href: '/eric-privat/liegestuetz', icon: 'ti-barbell', label: 'Liegestütz' },
    { href: '/eric-privat/essen-planer', icon: 'ti-tools-kitchen-2', label: 'Essen-Planer' },
    { href: '/eric-privat/kontenmodell', icon: 'ti-wallet', label: '6 Kontenmodell' },
  ] },
  { type: 'link', href: '/jahresplaner', icon: 'ti-calendar', label: 'Jahresplaner', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/ziele-entwicklung', icon: 'ti-target-arrow', label: 'Zieleentwicklung', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/persoenliche-assistenz', icon: 'ti-user-heart', label: 'Persönliche Assistenz', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/haushaltshilfe', icon: 'ti-home-heart', label: 'Haushaltshilfe', area: ['vertrieb', 'hv'], mod: 'privat' },
  { type: 'link', href: '/benachrichtigungen', icon: 'ti-bell', label: 'Benachrichtigungen', area: 'common' },
  { type: 'link', href: '/konto', icon: 'ti-user-cog', label: 'Mein Konto', area: 'common' },
  { type: 'link', href: '/nutzer', icon: 'ti-shield-lock', label: 'Nutzerverwaltung', area: 'common', mod: 'nutzer' },
  { type: 'group', key: 'berichte', icon: 'ti-report', label: 'Berichte', area: ['vertrieb', 'hv', 'backoffice'], mod: 'dashboards', items: [
    { href: '/berichte/offene-mieten', icon: 'ti-cash-off', label: 'Offene Mieten' },
  ] },
]

// Rechte-Knoten aus der Navigation: jede Kategorie (Gruppe) + jede Unterkategorie (Eintrag) einzeln.
const NODE_ADMIN_ONLY = (mod) => mod === 'nutzer' || mod === 'mahnprozess' || mod === 'privat'
export function permNodes() {
  const nodes = []
  NAV.forEach((n) => {
    if (n.type === 'group') {
      const adminOnly = n.key === 'eric-privat'
      nodes.push({ key: 'cat:' + n.key, label: n.label, level: 0, adminOnly })
      ;(n.items || []).forEach((it) => nodes.push({ key: 'sub:' + it.href, label: it.label, level: 1, adminOnly, parent: 'cat:' + n.key }))
    } else if (n.type === 'link' && n.mod) {
      nodes.push({ key: 'lnk:' + n.href, label: n.label, level: 0, adminOnly: NODE_ADMIN_ONLY(n.mod) })
    }
  })
  return nodes
}

// Zuordnung jeder Kategorie/Verknüpfung zu einem Geschäftsbereich
export const GESCHAEFTE = [
  { v: 'fav', label: 'Favoriten', icon: 'ti-star' },
  { v: 'desktop', label: 'Desktop', icon: 'ti-home', href: '/' },
  { v: 'vertrieb', label: 'Vertrieb', icon: 'ti-chart-line' },
  { v: 'buchhaltung', label: 'Buchhaltung', icon: 'ti-calculator' },
  { v: 'hausverwaltung', label: 'Hausverwaltung', icon: 'ti-home' },
  { v: 'hausmeisterdienst', label: 'Hausmeisterdienst', icon: 'ti-tools' },
  { v: 'gf', label: 'Geschäftsführer', icon: 'ti-user' },
  { v: 'wissen', label: 'Wissensdatenbank', icon: 'ti-book' },
]
export const GB_MAP = {
  ankauf: 'vertrieb', vermietung: 'vertrieb', crm: 'vertrieb', baustandard: 'vertrieb', assetmanagement: 'vertrieb', strategie: 'vertrieb',
  buchhaltung: 'buchhaltung', controlling: 'buchhaltung', finance: 'buchhaltung', 'assetmgmt-bh': 'vertrieb', stammdaten: 'buchhaltung',
  hausverwaltung: 'hausverwaltung', prozesse: 'hausverwaltung',
  produktivitaet: 'gf', personal: 'gf', 'eric-privat': 'gf',
  'gf-dashboard': 'gf', backoffice: 'gf', '/gf-dashboard': 'gf', '/beschluesse': 'gf', '/aktivitaeten': 'hausverwaltung', '/dokumente': 'buchhaltung', '/dms': 'buchhaltung', '/nutzer': 'gf',
  '/hausmeisterdienst': 'hausmeisterdienst', '/haushaltshilfe': 'gf', '/jahresplaner': 'gf', '/persoenliche-assistenz': 'gf', '/ziele-entwicklung': 'gf',
  wissensdatenbank: 'wissen',
}
// Zwei Arbeitsbereiche im Menü: "eric" (Geschäftsführung) und "team" (Verwalto: Tagesgeschäft von Ramona und Jürgen).
// Nicht aufgeführte Einträge erscheinen in beiden Bereichen.
export const BEREICHE = [
  { v: 'team', label: 'Verwalto', text: 'Hausverwaltung, Buchhaltung, Personal und Stammdaten – die tägliche Arbeit im Büro' },
  { v: 'eric', label: 'Eric', text: 'Geschäftsführung, Controlling, Finanzen, Assetmanagement, Vermietung und Persönliches' },
]
export const BEREICH_MAP = {
  'gf-dashboard': 'eric', '/beschluesse': 'eric', backoffice: 'eric', 'assetmgmt-bh': 'eric', assetmanagement: 'eric', strategie: 'eric',
  baustandard: 'eric', crm: 'eric', ankauf: 'eric', produktivitaet: 'eric', finance: 'eric', prozesse: 'eric', 'eric-privat': 'eric',
  '/jahresplaner': 'eric', '/ziele-entwicklung': 'eric', '/persoenliche-assistenz': 'eric', '/haushaltshilfe': 'eric',
  hausverwaltung: 'eric', buchhaltung: 'eric', personal: 'eric', stammdaten: 'eric', controlling: 'eric', vermietung: 'eric',
  '/hausmeisterdienst': 'eric', '/aktivitaeten': 'eric', berichte: 'eric', wissensdatenbank: 'eric', '/dokumente': 'eric', '/dms': 'eric',
  'v-buchhaltung': 'team', 'v-dokumente': 'team', 'v-fuhrpark': 'team', 'v-hausverwaltung': 'team', 'v-mahnwesen': 'team', 'v-personal': 'team', 'v-postfach': 'team', 'v-prozesslandkarte': 'team', 'v-stammdaten': 'team', 'v-verwaltung': 'team',
}
export const bereichOf = (n) => BEREICH_MAP[n.type === 'group' ? n.key : n.href] || 'beide'
export const gbOf = (n) => (n.type === 'group' ? GB_MAP[n.key] : GB_MAP[n.href])

export default function Sidebar({ user, demo, onLogout, role, perms }) {
  const path = usePathname()
  const [q, setQ] = useState('')
  const [suchdaten, setSuchdaten] = useState(null)
  const [favs, setFavs] = useState([])
  const [dragFav, setDragFav] = useState(null)
  const [favOpen, setFavOpen] = useState(true)
  const [zu, setZu] = useState(false)
  const [openCats, setOpenCats] = useState(() => new Set())
  const [catOrder, setCatOrder] = useState([])
  const [dragCat, setDragCat] = useState(null)
  const activeGroupKeyRef = useRef(null)
  const isAdmin = role === 'admin'
  const [bereich, setBereich] = useState('')
  useEffect(() => {
    const lies = () => { try { const b = localStorage.getItem('os_bereich'); setBereich(b === 'eric' || b === 'team' ? b : '') } catch (e) {} }
    lies()
    // Klick auf eine Kategorie im Cockpit: nur diese Kategorie im Menü aufklappen
    const oeffne = (e) => { const k = e && e.detail; if (!k) return; const n = new Set([k]); setOpenCats(n); try { localStorage.setItem('sidebar_open_cats', JSON.stringify([k])) } catch (er) {} }
    window.addEventListener('os-bereich', lies)
    window.addEventListener('storage', lies)
    window.addEventListener('os-oeffne', oeffne)
    return () => { window.removeEventListener('os-bereich', lies); window.removeEventListener('storage', lies); window.removeEventListener('os-oeffne', oeffne) }
  }, [])
  const waehleBereich = (b) => { setBereich(b); try { localStorage.setItem('os_bereich', b) } catch (e) {} ; try { window.dispatchEvent(new Event('os-bereich')) } catch (e) {} }

  const has = (key) => !!(perms && Object.prototype.hasOwnProperty.call(perms, key))
  const on = (key) => { const p = perms && perms[key]; return !!(p && p.sehen) }
  // Wer die Rolle eines Geschäftsbereichs trägt, sieht dessen Einträge automatisch
  // (z. B. Rolle "hausverwaltung" → alle Kategorien/Links im Bereich Hausverwaltung).
  const roleOwnsBereich = (n) => !!role && gbOf(n) === role
  const canSeeItem = (n, it) => {
    if (demo || isAdmin) return true
    if (String(n.key || '').startsWith('v-')) {
      if (it.offen) return true
      const h = it.perm || it.href
      return NAV.some((g) => g.type === 'group' && !String(g.key).startsWith('v-') && g.items.some((x) => x.href === h && canSeeItem(g, x)))
    }
    if (n.key === 'eric-privat') return isAdmin
    if (roleOwnsBereich(n)) return true
    if (!perms) return true
    const key = 'sub:' + it.href
    return has(key) ? on(key) : on(n.mod)
  }
  const canSee = (n) => {
    if (n.type === 'group') {
      if (demo || isAdmin) return true
      if (n.key === 'eric-privat') return isAdmin
      if (roleOwnsBereich(n)) return true
      if (!perms) return true
      const catKey = 'cat:' + n.key
      const base = has(catKey) ? on(catKey) : on(n.mod)
      return base || (n.items || []).some((it) => canSeeItem(n, it))
    }
    if (roleOwnsBereich(n)) return true
    if (!n.mod) return true
    if (demo || isAdmin) return true
    if (NODE_ADMIN_ONLY(n.mod)) return isAdmin
    if (!perms) return true
    const lnkKey = 'lnk:' + n.href
    return has(lnkKey) ? on(lnkKey) : on(n.mod)
  }

  useEffect(() => {
    try { const f = localStorage.getItem('sidebar_favs'); if (f) setFavs(JSON.parse(f)) } catch (e) {}
    try { setZu(localStorage.getItem('sidebar_zu') === '1') } catch (e) {}
    try { const fo = localStorage.getItem('sidebar_fav_open'); if (fo != null) setFavOpen(fo !== '0') } catch (e) {}
    try { const oc = localStorage.getItem('sidebar_open_cats'); if (oc) setOpenCats(new Set(JSON.parse(oc).slice(0, 1))) } catch (e) {}
    try { const co = localStorage.getItem('sidebar_cat_order'); if (co) setCatOrder(JSON.parse(co)) } catch (e) {}
  }, [])
  useEffect(() => { setQ('') }, [path])
  // Favoriten-Änderungen an die linke Favoritenleiste (FavRail) melden
  useEffect(() => { try { window.dispatchEvent(new CustomEvent('wt-favs', { detail: favs })) } catch (e) {} }, [favs])
  // Favoriten-Änderungen von anderen Stellen (FavToggle/andere Tabs) übernehmen
  useEffect(() => {
    const apply = (arr) => setFavs((prev) => (JSON.stringify(prev) === JSON.stringify(arr) ? prev : arr))
    const onCustom = (e) => apply(Array.isArray(e.detail) ? e.detail : [])
    const onStorage = () => { try { const f = localStorage.getItem('sidebar_favs'); apply(f ? JSON.parse(f) : []) } catch (er) {} }
    window.addEventListener('wt-favs', onCustom)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('wt-favs', onCustom); window.removeEventListener('storage', onStorage) }
  }, [])

  const isFav = (href) => favs.includes(href)
  const toggleFav = (href, e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setFavs((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
      try { localStorage.setItem('sidebar_favs', JSON.stringify(next)) } catch (er) {}
      return next
    })
  }

  // Favoriten umsortieren: 'dragged' vor 'target' einfügen (target=null → ans Ende)
  const moveFavBefore = (dragged, target) => {
    if (!dragged || dragged === target) return
    setFavs((prev) => {
      const arr = prev.filter((h) => h !== dragged)
      const to = target == null ? -1 : arr.indexOf(target)
      if (to < 0) arr.push(dragged); else arr.splice(to, 0, dragged)
      try { localStorage.setItem('sidebar_favs', JSON.stringify(arr)) } catch (er) {}
      return arr
    })
  }

  const isActive = (item) => item.exact ? path === item.href : (path === item.href || path.startsWith(item.href + '/'))
  const toggleFavOpen = () => setFavOpen((v) => { const n = !v; try { localStorage.setItem('sidebar_fav_open', n ? '1' : '0') } catch (e) {} return n })
  // Kacheln: immer nur eine geöffnet. Ein Klick auf eine andere Kachel schließt die bisherige.
  const toggleCat = (key) => setOpenCats((prev) => {
    const offen = prev.size ? prev.has(key) : key === activeGroupKeyRef.current
    const next = new Set([offen ? '__keine' : key])
    try { localStorage.setItem('sidebar_open_cats', JSON.stringify([...next])) } catch (e) {}
    return next
  })

  const email = user && user.email ? user.email : null
  const initials = email ? email.slice(0, 2).toUpperCase() : 'EE'

  const flatSearch = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) flatSearch.push({ href: n.href, label: n.label, icon: n.icon, group: '' }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) flatSearch.push({ href: it.href, label: it.label, icon: it.icon, group: n.label }) }) }
  })
  const ql = q.trim().toLowerCase()
  const results = ql ? flatSearch.filter((x) => (x.label + ' ' + x.group).toLowerCase().includes(ql)) : []
  useEffect(() => { if (q.trim().length >= 2 && !demo) suchdatenLaden().then((d) => setSuchdaten(d)) }, [q, demo])
  const woerter = normS(q.trim()).split(' ').filter(Boolean)
  const datenTreffer = (() => {
    if (!suchdaten || q.trim().length < 2) return []
    const proTyp = {}, out = []
    for (const x of suchdaten) {
      if (!woerter.every((w) => x.text.includes(w))) continue
      proTyp[x.typ] = (proTyp[x.typ] || 0) + 1; if (proTyp[x.typ] > 8) continue
      out.push(x); if (out.length >= 40) break
    }
    return out
  })()
  const datenOeffnen = (e, href) => { e.preventDefault(); setQ(''); try { window.postMessage({ osOeffne: href }, window.location.origin) } catch (er) { window.location.href = href } }

  // Aktive Gruppe/Link aus dem aktuellen Pfad
  const activeGroupPath = NAV.find((n) => n.type === 'group' && canSee(n) && n.items.some(isActive))
  const activeGroupKey = activeGroupPath ? activeGroupPath.key : null
  activeGroupKeyRef.current = activeGroupKey
  // Wechselt die Seite in eine andere Kategorie (z. B. über Favoriten oder Suche), wird deren Kachel geöffnet
  useEffect(() => { if (activeGroupKey) setOpenCats((prev) => (prev.has(activeGroupKey) ? prev : new Set([activeGroupKey]))) }, [activeGroupKey])

  // Favoriten
  const allLeaf = []
  NAV.forEach((n) => {
    if (n.type === 'link') { if (canSee(n)) allLeaf.push({ href: n.href, label: n.label, icon: n.icon }) }
    else if (n.type === 'group' && canSee(n)) { n.items.forEach((it) => { if (canSeeItem(n, it)) allLeaf.push({ href: it.href, label: it.label, icon: it.icon }) }) }
  })
  const favItems = favs.map((h) => allLeaf.find((x) => x.href === h)).filter(Boolean)
  const isRestricted = !!role && role !== 'admin'
  const FAV_PIN = { href: '/verbesserungen', label: 'Verbesserungsvorschläge', icon: 'ti-bulb' }
  const favView = [FAV_PIN, ...favItems.filter((x) => x.href !== '/verbesserungen')]

  // Hauptkategorien: eigene Reihenfolge (per Drag & Drop, im Browser gespeichert)
  const navId = (n) => (n.type === 'group' ? 'cat:' + n.key : 'lnk:' + n.href)
  const navRank = (n, i) => { const r = catOrder.indexOf(navId(n)); return r < 0 ? 1000 + i : r }
  const allVisible = NAV.map((n, i) => ({ n, r: navRank(n, i) })).sort((a, b) => a.r - b.r).map((x) => x.n).filter((n) => canSee(n) && (n.type !== 'group' || n.items.some((it) => canSeeItem(n, it))))
  const imBereich = (n, b) => { const x = bereichOf(n); return x === 'beide' || x === b }
  const bereicheSichtbar = BEREICHE.filter((b) => allVisible.some((n) => bereichOf(n) === b.v))
  const aktBereich = bereicheSichtbar.some((b) => b.v === bereich) ? bereich : (bereicheSichtbar.length ? (isAdmin && bereicheSichtbar.some((b) => b.v === 'eric') ? 'eric' : bereicheSichtbar[bereicheSichtbar.length - 1].v) : '')
  // Im Bereich Verwalto stehen die Kategorien alphabetisch, die gemeinsamen Links (Cockpit, Alle Tools …) darunter
  const alphaBereich = (b) => b === 'team'
  const sortAlpha = (L, b) => { if (!alphaBereich(b)) return L; const eig = L.filter((n) => bereichOf(n) === b).sort((x, y) => x.label.localeCompare(y.label, 'de')); return eig.concat(L.filter((n) => bereichOf(n) !== b)) }
  const visibleNav = aktBereich ? sortAlpha(allVisible.filter((n) => imBereich(n, aktBereich)), aktBereich) : allVisible
  useEffect(() => {
    try {
      window.__osBereiche = { aktiv: aktBereich, liste: bereicheSichtbar.map((b) => ({ v: b.v, label: b.label, text: b.text, kategorien: sortAlpha(allVisible.filter((n) => bereichOf(n) === b.v), b.v).map((n) => ({ label: n.label, key: n.type === 'group' ? n.key : '', href: n.type === 'group' ? '' : n.href })) })) }
      window.dispatchEvent(new Event('os-bereiche'))
    } catch (e) {}
  })
  // 'dragged' vor 'target' einfügen (target=null → ans Ende)
  const moveCatBefore = (dragged, target) => {
    if (!dragged || dragged === target) return
    const all = NAV.map((n, i) => ({ id: navId(n), r: navRank(n, i) })).sort((a, b) => a.r - b.r).map((x) => x.id)
    const arr = all.filter((id) => id !== dragged)
    const to = target == null ? -1 : arr.indexOf(target)
    if (to < 0) arr.push(dragged); else arr.splice(to, 0, dragged)
    setCatOrder(arr)
    try { localStorage.setItem('sidebar_cat_order', JSON.stringify(arr)) } catch (e) {}
  }
  const resetCatOrder = () => { setCatOrder([]); try { localStorage.removeItem('sidebar_cat_order') } catch (e) {} }
  const dragProps = (n) => {
    const id = navId(n)
    return {
      draggable: true,
      onDragStart: (e) => { setDragCat(id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id) } catch (er) {} },
      onDragEnd: () => setDragCat(null),
      onDragOver: (e) => { if (dragCat && dragCat !== id) e.preventDefault() },
      onDrop: (e) => { e.preventDefault(); moveCatBefore(dragCat, id); setDragCat(null) },
      style: { opacity: dragCat === id ? 0.4 : 1 },
      className: 'sbx-dragcat' + (dragCat && dragCat !== id ? ' droptarget' : ''),
      title: 'Ziehen zum Umsortieren',
    }
  }
  const toggleZu = () => setZu((v) => { const n = !v; try { localStorage.setItem('sidebar_zu', n ? '1' : '0') } catch (e) {} return n })
  const catOpen = (n) => (openCats.size ? openCats.has(n.key) : n.key === activeGroupKey)

  if (zu) return (
    <aside className="sbx sbx-zu">
      <button className="sbx-zubtn" title="Menü einblenden" onClick={toggleZu}>›</button>
    </aside>
  )

  return (
    <aside className="sbx">
      <div className="sbx-brand-row">
        <Link href="/" className="sbx-brand" title="Zum Cockpit">
          <div className="logo">W</div>
          <div><div className="name">Wohntraum</div><div className="sub">Rheinhessen OS</div></div>
        </Link>
        <button className="sbx-logout sbx-zuklapp" title="Menü einklappen" onClick={toggleZu}>‹</button>
        {!demo && <button className="sbx-logout" title="Abmelden" onClick={onLogout}><i className="ti ti-logout" /></button>}
      </div>

      {bereicheSichtbar.length > 1 && (
        <div className="sbx-bereich">
          {bereicheSichtbar.map((b) => (
            <button key={b.v} className={aktBereich === b.v ? 'on' : ''} onClick={() => waehleBereich(b.v)}>{b.label}</button>
          ))}
        </div>
      )}

      <div className="sbx-search">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQ('') }} placeholder="Suchen: Seite, Mieter, Objekt, Kontakt …" />
        {ql && (
          <div className="sbx-results">
            {results.length > 0 && <div className="sbx-reshd">Seiten</div>}
            {results.map((x) => (
              <Link key={x.href} href={x.href} className={isActive(x) ? 'active' : ''} onClick={() => setQ('')}>
                <i className={'ti ' + x.icon} /> {x.label}{x.group && <span className="grp">{x.group}</span>}
              </Link>
            ))}
            {datenTreffer.length > 0 && <div className="sbx-reshd">Mieter, Objekte, Kontakte und mehr</div>}
            {datenTreffer.map((x, i) => (
              <a key={x.typ + i + x.href} href={x.href} className="sbx-daten" onClick={(e) => datenOeffnen(e, x.href)}>
                <span className="dt"><b>{x.label}</b>{x.sub && <span className="ds">{x.sub}</span>}</span><span className="grp">{x.typ}</span>
              </a>
            ))}
            {!results.length && !datenTreffer.length && <div className="sbx-noresult">{q.trim().length >= 2 && !suchdaten ? 'Suche läuft …' : 'Kein Treffer für „' + q + '"'}</div>}
          </div>
        )}
      </div>

      {/* Favoriten – ganz oben, ein-/ausklappbar, per Drag & Drop umsortierbar */}
      <div className="sbx-sec">
        <button className="sbx-sechd" onClick={toggleFavOpen} title={favOpen ? 'Favoriten einklappen' : 'Favoriten ausklappen'}>
          <i className="ti ti-star" style={{ color: '#f5c518' }} /> <span>Favoriten</span>
          <i className={'ti ' + (favOpen ? 'ti-chevron-down' : 'ti-chevron-right')} style={{ marginLeft: 'auto', fontSize: 15 }} />
        </button>
        {favOpen && (
          <div className="sbx-favlist">
            {favView.length ? favView.map((it) => (
              <div key={it.href} className="sbx-favrow"
                draggable
                onDragStart={(e) => { setDragFav(it.href); e.dataTransfer.effectAllowed = 'move' }}
                onDragEnd={() => setDragFav(null)}
                onDragOver={(e) => { if (dragFav && dragFav !== it.href) e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, it.href); setDragFav(null) }}
                style={{ opacity: dragFav === it.href ? 0.4 : 1 }}
              >
                <i className="ti ti-grip-vertical grip" title="Ziehen zum Umsortieren" />
                <Link href={it.href} className={'sbx-link' + (isActive(it) ? ' active' : '')} onClick={() => setQ('')}>
                  <i className={'ti ' + it.icon} /> <span>{it.label}</span>
                </Link>
                {it.href !== '/verbesserungen' && (
                  <span className="sbx-star on" onClick={(e) => toggleFav(it.href, e)} title="Aus Favoriten entfernen">★</span>
                )}
              </div>
            )) : <div className="sbx-empty">Noch keine Favoriten – Stern ☆ neben einer Unterkategorie antippen.</div>}
            {dragFav && (
              <div className="sbx-dropend"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); moveFavBefore(dragFav, null); setDragFav(null) }}
                title="Ans Ende verschieben">ans Ende</div>
            )}
          </div>
        )}
      </div>

      {/* Alle Kategorien & Unterkategorien */}
      <nav className="sbx-nav">
        {visibleNav.map((n) => {
          if (n.type === 'link') return (
            <div key={n.href} {...dragProps(n)}>
            <div className="sbx-linkrow">
              <i className="ti ti-grip-vertical grip" />
              <Link href={n.href} className={'sbx-link' + (isActive(n) ? ' active' : '')}>
                <i className={'ti ' + n.icon} /> <span>{n.label}</span>
              </Link>
              {n.mod && <span className={'sbx-star' + (isFav(n.href) ? ' on' : '')} onClick={(e) => toggleFav(n.href, e)} title={isFav(n.href) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>{isFav(n.href) ? '★' : '☆'}</span>}
            </div>
            </div>
          )
          const vis0 = n.items.filter((it) => canSeeItem(n, it))
          const vis = alphaBereich(bereichOf(n)) ? vis0.slice().sort((x, y) => x.label.localeCompare(y.label, 'de')) : vis0
          if (!vis.length) return null
          const open = catOpen(n)
          return (
            <div key={n.key} {...dragProps(n)}>
            <div className={'sbx-cat sbx-kachel' + (open ? ' offen' : '')}>
              <button className={'sbx-catbtn' + (n.key === activeGroupKey ? ' active' : '')} onClick={() => toggleCat(n.key)}>
                <i className="ti ti-grip-vertical grip" />
                <span className="kic"><i className={'ti ' + n.icon} /></span> <span className="klab">{n.label}</span>
                <i className={'ti ' + (open ? 'ti-chevron-down' : 'ti-chevron-right')} style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.7 }} />
              </button>
              {open && (
                <div className="sbx-sub">
                  {vis.map((it) => (
                    <div key={it.href} className="sbx-subrow">
                      <Link href={it.href} className={'sbx-link' + (isActive(it) ? ' active' : '')}>
                        <i className={'ti ' + it.icon} /> <span>{it.label}</span>
                      </Link>
                      <span className={'sbx-star' + (isFav(it.href) ? ' on' : '')} onClick={(e) => toggleFav(it.href, e)} title={isFav(it.href) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>{isFav(it.href) ? '★' : '☆'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          )
        })}
        {dragCat && (
          <div className="sbx-dropend"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); moveCatBefore(dragCat, null); setDragCat(null) }}
            title="Ans Ende verschieben">ans Ende</div>
        )}
        {catOrder.length > 0 && !dragCat && (
          <button className="sbx-resetorder" onClick={resetCatOrder} title="Ursprüngliche Reihenfolge der Kategorien wiederherstellen">
            <i className="ti ti-arrow-back-up" /> Reihenfolge zurücksetzen
          </button>
        )}
      </nav>

      <div className="sbx-foot">
        <div className="av" title={email || 'Demo-Modus'}>{initials}</div>
        <div className="sbx-me">{email || 'Demo-Modus'}</div>
      </div>
    </aside>
  )
}
