// Neuvermietung und Asana
// - aktion 'msa_eingang' (ohne Anmeldung, geprüft über den Link-Token): Selbstauskunft ist eingegangen -> Asana-Aufgabe für Eric
//   mit den Unteraufgaben „Freigeben“ und „Ablehnen“
// - aktion 'sync' (angemeldet): gleicht alle Karten der Neuvermietung mit Asana ab
//     Selbstauskunft: Eric erledigt „Freigeben“ -> Karte geht in die Mietkalkulation, „Ablehnen“ -> Karte ins Archiv
//     Mietkalkulation: Aufgabe für Eric „Mietkalkulation erstellen“, erledigt -> Mietangebot
//     Mietangebot: Aufgabe für Ramona „Mietangebot erstellen“, erledigt -> Mietvertrag
//     Mietvertrag: Aufgabe für Ramona „Mietvertrag erstellen“, erledigt -> Mietvertrag unterschrieben
//   Wird eine Karte im OS weitergeschoben, hakt der Abgleich die offene Asana-Aufgabe des alten Schritts ab.
// - aktion 'einzug' (angemeldet): legt nach „Mietvertrag unterschrieben“ das Asana-Projekt 03_EINZUG aus der Vorlage an
// Benötigt in Vercel: ASANA_TOKEN. Optional: NV_ASANA_ERIC, NV_ASANA_RAMONA (Asana-Nutzer-IDs)
import { angemeldet, antwort } from '../_lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WS = () => process.env.ASANA_WORKSPACE || '1206683226417804'
const ERIC = () => process.env.NV_ASANA_ERIC || '1206683791343678'
const RAMONA = () => process.env.NV_ASANA_RAMONA || '1210557015422572'
const VORLAGE_EINZUG = '1211754418883042', TEAM_VERMIETUNG = '1208033134144722'
const SP = ['selbstauskunft', 'kalkulation', 'angebot', 'vertrag', 'unterschrieben']
const SPN = { selbstauskunft: 'Mieterselbstauskunft', kalkulation: 'Mietkalkulation', angebot: 'Mietangebot', vertrag: 'Mietvertrag', unterschrieben: 'Mietvertrag unterschrieben' }
const ERI = { selbstauskunft: '2 · Selbstauskunft', kalkulation: '6 · Kalkulation Mietangebot', angebot: '7 · Mietangebot', vertrag: '8 · Mietvertragsentwurf', unterschrieben: '11 · Schlüsselübergabe' }
// Aufgabe je Schritt: wer, Titel
const AUFG = {
  kalkulation: { wer: ERIC, titel: 'Mietkalkulation erstellen', text: 'Bitte die Mietkalkulation im Wohntraum OS erstellen (Neuvermietung, Kachel „Mietkalkulation“). Wenn sie fertig ist, diese Aufgabe abhaken – der Mieter springt dann automatisch zum Mietangebot.' },
  angebot: { wer: RAMONA, titel: 'Mietangebot erstellen', text: 'Die Mietkalkulation ist fertig. Bitte das Mietangebot erstellen und an den Mietinteressenten senden (Neuvermietung, Kachel „Mietangebot“). Danach diese Aufgabe abhaken – der Mieter springt dann automatisch zum Mietvertrag.' },
  vertrag: { wer: RAMONA, titel: 'Mietvertrag erstellen', text: 'Das Mietangebot ist angenommen. Bitte den Mietvertrag erstellen (Neuvermietung, Kachel „Mietvertrag“). Danach diese Aufgabe abhaken – der Mieter springt dann zu „Mietvertrag unterschrieben“.' },
}
const MSA_ZEILEN = [['objekt', 'Objekt'], ['einzug', 'Einzug'], ['personen', 'Personen'], ['arbeit', 'Arbeitsverhältnis'], ['arbeitgeber', 'Arbeitgeber / seit'], ['einkommen', 'Nettoeinkommen Haushalt'], ['amt', 'Miete zahlt Jobcenter / Sozialamt'], ['behoerde', 'Behörde'], ['haustiere', 'Haustiere'], ['haustiere_welche', 'Welche Haustiere'], ['eidesstattlich', 'Eidesstattliche Versicherung / Haftbefehl (3 Jahre)'], ['info', 'Wichtige Informationen']]

const p2 = n => String(n).padStart(2, '0')
const dmy = s => { const x = String(s || '').slice(0, 10); return /^\d{4}-\d\d-\d\d$/.test(x) ? x.split('-').reverse().join('.') : String(s || '') }
const heute = () => { const d = new Date(Date.now() + 2 * 3600e3); return d.toISOString().slice(0, 10) }
const plusTage = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const nameVoll = k => [k.vorname, k.name].filter(Boolean).join(' ') || k.kontakt || 'Interessent'

async function asana(pfad, opt = {}) {
  const r = await fetch('https://app.asana.com/api/1.0' + pfad, {
    method: opt.method || 'GET',
    headers: { Authorization: 'Bearer ' + process.env.ASANA_TOKEN, Accept: 'application/json', ...(opt.json ? { 'Content-Type': 'application/json' } : {}) },
    body: opt.json ? JSON.stringify({ data: opt.json }) : undefined, cache: 'no-store'
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) { const e = new Error((j.errors && j.errors[0] && j.errors[0].message) || ('Asana-Fehler ' + r.status)); e.status = r.status; throw e }
  return j.data
}
// Supabase: öffentlich (anon) für die Datenbankfunktionen, angemeldet mit dem Token des Nutzers (RLS)
async function db(pfad, opt = {}, auth) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const r = await fetch(url + '/rest/v1/' + pfad, { method: opt.method || 'GET', headers: { apikey: key, Authorization: auth || ('Bearer ' + key), 'Content-Type': 'application/json', ...(opt.prefer ? { Prefer: opt.prefer } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null } catch (e) { }
  if (!r.ok) throw new Error((j && j.message) || ('Datenbankfehler ' + r.status))
  return j
}
const rpc = (fn, args) => db('rpc/' + fn, { method: 'POST', body: args })
const osLink = req => { const o = req.headers.get('origin') || ('https://' + (req.headers.get('host') || '')); return o.replace(/\/$/, '') + '/verwalto/neuvermietung' }

async function aufgabeAnlegen({ name, notes, wer, faellig, unter }) {
  const t = await asana('/tasks?opt_fields=permalink_url', { method: 'POST', json: { name, notes, workspace: WS(), assignee: wer, due_on: faellig || plusTage(2) } })
  for (const u of unter || []) await asana('/tasks/' + t.gid + '/subtasks', { method: 'POST', json: { name: u, assignee: wer } })
  return { gid: t.gid, link: t.permalink_url || ('https://app.asana.com/0/0/' + t.gid), erstellt: new Date().toISOString() }
}
function msaText(d, link) {
  d = d || {}
  const z = MSA_ZEILEN.filter(([f]) => d[f] != null && d[f] !== '').map(([f, l]) => l + ': ' + (/^\d{4}-\d\d-\d\d$/.test(d[f]) ? dmy(d[f]) : d[f]))
  const warn = [d.amt === 'JA' ? 'Hinweis: Die Miete übernimmt das Jobcenter / Sozialamt.' : '', d.eidesstattlich === 'JA' ? 'ACHTUNG: Eidesstattliche Versicherung oder Haftbefehl in den letzten 3 Jahren: JA' : ''].filter(Boolean)
  return [(warn.length ? warn.join('\n') + '\n' : '') + 'Die Mieterselbstauskunft ist eingegangen. Bitte prüfen und eine der Unteraufgaben abhaken:\n- „Freigeben“: der Mieter springt im OS weiter zur Mietkalkulation\n- „Ablehnen“: der Mieter wird im OS ins Archiv gelegt',
    z.join('\n'), 'Vollständige Selbstauskunft mit Unterschrift im Wohntraum OS: ' + link].filter(Boolean).join('\n\n')
}
async function msaAufgabe(k, d, link) {
  const name = 'Mieterselbstauskunft prüfen: ' + ([d && d.vorname, d && d.nachname].filter(Boolean).join(' ') || nameVoll(k)) + (k.wohnung && k.wohnung.label ? ' – ' + k.wohnung.label.split(' · ')[0] : '')
  return aufgabeAnlegen({ name, notes: msaText(d, link), wer: ERIC(), unter: ['Freigeben', 'Ablehnen'] })
}

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))
    if (!process.env.ASANA_TOKEN) return antwort({ ok: false, hinweis: 'Asana ist nicht verbunden (ASANA_TOKEN fehlt).' })

    // ---------- öffentlich: Selbstauskunft eingegangen ----------
    if (b.aktion === 'msa_eingang') {
      const token = String(b.token || ''); if (token.length < 20) return antwort({ ok: false })
      const d = await rpc('selbstauskunft_fuer_asana', { p_token: token })
      if (!d) return antwort({ ok: true, schon: true })
      const k = Object.assign({ id: d.karte_id }, d.karte || {})
      const t = await msaAufgabe(k, d.daten, osLink(req))
      await rpc('selbstauskunft_asana_setzen', { p_token: token, p_gid: t.gid, p_link: t.link })
      return antwort({ ok: true })
    }

    const u = await angemeldet(req)
    if (!u) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const AUTH = req.headers.get('authorization')
    const wer = String(u.email || '').toLowerCase()
    const VON = { 'ramona@andersmacher.info': 'Ramona Romanelli', 'juergen@andersmacher.info': 'Jürgen Reuter', 'eric@andersmacher.info': 'Eric Eisenhardt' }[wer] || wer
    const speichern = k => { k.geaendert = new Date().toISOString(); return db('os_docs?on_conflict=app,pfad', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { app: 'oc', pfad: 'neuvermietung/' + k.id, data: k, updated_at: k.geaendert } }, AUTH) }
    const log = (k, text) => (k.verlauf = k.verlauf || []).push({ t: new Date().toISOString(), von: 'Asana', text })
    const eriSync = async k => { if (!k.iid || !ERI[k.spalte]) return; try { await db('mietinteressenten?id=eq.' + encodeURIComponent(k.iid), { method: 'PATCH', prefer: 'return=minimal', body: { status: ERI[k.spalte], updated_at: new Date().toISOString() } }, AUTH) } catch (e) { } }

    // ---------- Einzug: Asana-Projekt aus der Vorlage ----------
    if (b.aktion === 'einzug') {
      const rows = await db('os_docs?select=data&app=eq.oc&pfad=eq.' + encodeURIComponent('neuvermietung/' + String(b.id || '')), {}, AUTH)
      const k = rows && rows[0] && rows[0].data; if (!k) return antwort({ error: 'Karte nicht gefunden.' }, 404)
      k.asana = k.asana || {}
      if (k.asana.einzug && k.asana.einzug.gid) return antwort({ ok: true, einzug: k.asana.einzug })
      const ein = k.wohnung && k.wohnung.einheit_id ? (await db('obj_einheiten?select=id,objekt_id,bezeichnung&id=eq.' + encodeURIComponent(k.wohnung.einheit_id), {}, AUTH))[0] : null
      const o = ein ? (await db('obj_objekte?select=id,kz,strasse,plz,ort,gesellschaft&id=eq.' + encodeURIComponent(ein.objekt_id), {}, AUTH))[0] : null
      const ges = String((o && o.gesellschaft) || '').trim(), gk = ges.length <= 3 ? ges.toUpperCase() : /eisenhardt/i.test(ges) ? 'EE' : /wohn/i.test(ges) ? 'WT' : ''
      const beginn = (k.kalk && k.kalk.beginn) || heute()
      const name = ['03_EINZUG', o ? o.kz : '', [String(k.name || '').toUpperCase(), k.vorname].filter(Boolean).join(', '), dmy(beginn), o ? gk + o.kz : '', ein ? ein.bezeichnung : '', o ? o.strasse : '', o ? o.ort : ''].join(' I ')
      const vt = await asana('/project_templates/' + VORLAGE_EINZUG + '?opt_fields=requested_dates.gid,requested_roles.gid')
      const json = { name, team: TEAM_VERMIETUNG, public: true }
      if (vt && vt.requested_dates && vt.requested_dates.length) json.requested_dates = vt.requested_dates.map(x => ({ gid: x.gid, value: beginn }))
      const job = await asana('/project_templates/' + VORLAGE_EINZUG + '/instantiateProject?opt_fields=new_project.gid,new_project.permalink_url', { method: 'POST', json })
      const pg = job && job.new_project && job.new_project.gid
      k.asana.einzug = { gid: pg || '', link: (job.new_project && job.new_project.permalink_url) || (pg ? 'https://app.asana.com/0/' + pg + '/list' : ''), erstellt: new Date().toISOString(), name }
      ;(k.verlauf = k.verlauf || []).push({ t: new Date().toISOString(), von: VON, text: 'Asana-Projekt angelegt: ' + name })
      await speichern(k)
      return antwort({ ok: true, einzug: k.asana.einzug })
    }

    // ---------- Abgleich ----------
    if (b.aktion === 'sync') {
      const [rows, msa] = await Promise.all([
        db('os_docs?select=data&app=eq.oc&pfad=like.' + encodeURIComponent('neuvermietung/%'), {}, AUTH),
        db('mieterselbstauskunft?select=id,token,karte_id,status,daten,eingegangen_at,created_at,asana_gid,asana_link', {}, AUTH)])
      const MSA = {}; (msa || []).forEach(r => { if (r.karte_id && (!MSA[r.karte_id] || String(r.created_at) > String(MSA[r.karte_id].created_at))) MSA[r.karte_id] = r })
      const link = osLink(req), fehler = []; let n = 0
      for (const r of rows || []) {
        const k = r.data; if (!k || !k.id || k.pid) continue
        let neu = false; k.asana = k.asana || {}; const A = k.asana
        try {
          const i = SP.indexOf(k.spalte || 'selbstauskunft')
          // 1. Offene Aufgaben früherer Schritte abhaken (Karte wurde im OS weitergeschoben oder archiviert)
          for (const s of ['selbstauskunft', 'kalkulation', 'angebot', 'vertrag']) {
            const a = A[s]; if (!a || !a.gid || a.erledigt) continue
            if (k.archiv || SP.indexOf(s) < i) { try { await asana('/tasks/' + a.gid, { method: 'PUT', json: { completed: true } }) } catch (e) { if (e.status !== 404) throw e } a.erledigt = new Date().toISOString(); neu = true }
          }
          if (k.archiv) { if (neu) { await speichern(k); n++ } continue }
          // 2. Selbstauskunft
          if (k.spalte === 'selbstauskunft' || !k.spalte) {
            const s = MSA[k.id]
            if (s && s.status === 'eingegangen' && !(A.selbstauskunft && A.selbstauskunft.gid)) {
              if (s.asana_gid && s.asana_gid !== 'pending') { A.selbstauskunft = { gid: s.asana_gid, link: s.asana_link || '', erstellt: s.eingegangen_at }; neu = true }
              else if (!s.asana_gid || Date.now() - Date.parse(s.eingegangen_at) > 5 * 60e3) {
                A.selbstauskunft = await msaAufgabe(k, s.daten, link); neu = true; log(k, 'Aufgabe für Eric angelegt: Mieterselbstauskunft prüfen')
                try { await db('mieterselbstauskunft?id=eq.' + s.id, { method: 'PATCH', prefer: 'return=minimal', body: { asana_gid: A.selbstauskunft.gid, asana_link: A.selbstauskunft.link } }, AUTH) } catch (e) { }
              }
            }
            const a = A.selbstauskunft
            if (a && a.gid && !a.erledigt && !k.freigabeMsa) {
              const [t, sub] = await Promise.all([asana('/tasks/' + a.gid + '?opt_fields=completed'), asana('/tasks/' + a.gid + '/subtasks?opt_fields=name,completed')])
              const ab = (sub || []).find(x => /ablehn/i.test(x.name) && x.completed), fr = (sub || []).find(x => /freigeb/i.test(x.name) && x.completed)
              if (ab) {
                k.archiv = { grund: 'Abgelehnt von Eric (Asana)', am: heute(), von: 'Eric Eisenhardt' }; log(k, 'In Asana abgelehnt – ins Archiv gelegt')
                if (!t.completed) await asana('/tasks/' + a.gid, { method: 'PUT', json: { completed: true } })
                a.erledigt = new Date().toISOString(); neu = true
              } else if (fr || t.completed) {
                k.freigabeMsa = { von: 'Eric Eisenhardt (Asana)', am: new Date().toISOString() }; log(k, 'Mieterselbstauskunft in Asana freigegeben')
                if (!t.completed) await asana('/tasks/' + a.gid, { method: 'PUT', json: { completed: true } })
                a.erledigt = new Date().toISOString(); k.spalte = 'kalkulation'; k.seit = new Date().toISOString(); log(k, 'Verschoben: Mieterselbstauskunft → Mietkalkulation'); neu = true; await eriSync(k)
              }
            } else if (a && a.gid && !a.erledigt && k.freigabeMsa) {
              // im OS freigegeben, Aufgabe noch offen
              try { await asana('/tasks/' + a.gid, { method: 'PUT', json: { completed: true } }) } catch (e) { if (e.status !== 404) throw e }
              a.erledigt = new Date().toISOString(); neu = true
              if (k.spalte === 'selbstauskunft') { k.spalte = 'kalkulation'; k.seit = new Date().toISOString(); await eriSync(k) }
            }
          }
          // 3. Mietkalkulation, Mietangebot, Mietvertrag: Aufgabe anlegen, erledigt -> weiter
          for (let runde = 0; runde < 3; runde++) {
            const s = k.spalte, def = AUFG[s]; if (!def || k.archiv) break
            const a = A[s]
            if (!a || !a.gid) {
              const name = def.titel + ': ' + nameVoll(k) + (k.wohnung && k.wohnung.label ? ' – ' + k.wohnung.label.split(' · ')[0] : '')
              A[s] = await aufgabeAnlegen({ name, notes: def.text + '\n\nIm Wohntraum OS öffnen: ' + link, wer: def.wer() })
              log(k, 'Aufgabe angelegt: ' + def.titel); neu = true; break
            }
            if (a.erledigt) break
            const t = await asana('/tasks/' + a.gid + '?opt_fields=completed')
            if (!t.completed) break
            a.erledigt = new Date().toISOString(); const z = SP[SP.indexOf(s) + 1]
            k.spalte = z; k.seit = new Date().toISOString(); log(k, def.titel + ' in Asana erledigt – verschoben: ' + SPN[s] + ' → ' + SPN[z]); neu = true; await eriSync(k)
          }
        } catch (e) { fehler.push(nameVoll(k) + ': ' + (e.message || e)) }
        if (neu) { await speichern(k); n++ }
      }
      return antwort({ ok: true, geaendert: n, fehler })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    return antwort({ ok: false, error: e.message || String(e) }, 500)
  }
}
