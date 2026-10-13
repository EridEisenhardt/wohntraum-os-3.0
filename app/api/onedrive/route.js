// OneDrive / SharePoint für das Wohntraum OS: Mieterordner finden, Dateien auflisten, hochladen, öffnen, löschen.
// Nutzt die App-Registrierung aus MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET (Berechtigung Sites.ReadWrite.All).
// MS_SP_SITE (optional): SharePoint-Seite, Standard andersmacher.sharepoint.com:/sites/WohnTraumRheinhessenGmbH9
import { angemeldet, antwort } from '../_lib/auth'
import { graph, graphBereit } from '../_lib/graph'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ROOT = 'Prozesslandkarte 3.0'
const GEB = ROOT + '/7.000 Gebäude'
const GRUPPEN = ['Gebäude EE', 'Gebäude WT', 'Gebäude KiBo']
const AKTUELL = '02 Mieter/01 Aktuelle Mieter', ARCHIV = '02 Mieter/02 Archiv – ehemalige Mieter'
let DRIVE = { id: '', bis: 0 }

const enc = p => p.split('/').map(encodeURIComponent).join('/')
function pruefe(p) {
  p = String(p || '').replace(/^\/+|\/+$/g, '')
  if (!(p === ROOT || p.startsWith(ROOT + '/')) || p.split('/').some(t => t === '..' || t === '.')) throw new Error('Pfad nicht erlaubt.')
  return p
}
async function drive() {
  if (DRIVE.id && Date.now() < DRIVE.bis) return DRIVE.id
  const site = process.env.MS_SP_SITE || 'andersmacher.sharepoint.com:/sites/WohnTraumRheinhessenGmbH9'
  const s = await graph('/sites/' + site + '?$select=id')
  const d = await graph('/sites/' + s.id + '/drive?$select=id,name')
  DRIVE = { id: d.id, bis: Date.now() + 3600e3 }
  return d.id
}
const item = x => ({ id: x.id, name: x.name, ordner: !!x.folder, size: x.size || 0, geaendert: x.lastModifiedDateTime, web: x.webUrl })
async function kinder(pfad) {
  const d = await drive(); const out = []
  let url = '/drives/' + d + '/root:/' + enc(pfad) + ':/children?$top=999&$select=id,name,size,folder,file,lastModifiedDateTime,webUrl'
  while (url) {
    const j = await graph(url, { erlaube404: true }); if (!j) return null
    out.push(...(j.value || []).map(item)); url = j['@odata.nextLink'] || ''
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

export async function POST(req) {
  try {
    if (!(await angemeldet(req))) return antwort({ error: 'Bitte im Wohntraum OS anmelden.' }, 401)
    const fehlt = graphBereit()
    if (fehlt.length) return antwort({ error: 'OneDrive ist noch nicht verbunden. In Vercel fehlt: ' + fehlt.join(', '), setup: true })
    const b = await req.json().catch(() => ({}))
    const a = b.aktion

    if (a === 'status') { const d = await drive(); const k = await kinder(GEB); return antwort({ ok: true, drive: d, objekte: k ? k.length : 0 }) }

    if (a === 'mieterordner') {
      // alle Mieterordner eines Objekts (aktuelle und ehemalige)
      const kz = norm(b.kz); if (!kz) return antwort({ error: 'Objektkürzel fehlt.' }, 400)
      const out = []
      for (const g of GRUPPEN) {
        const objs = (await kinder(GEB + '/' + g)) || []
        for (const o of objs.filter(o => o.ordner)) {
          const n = norm(o.name)
          if (!(n === kz || n.startsWith('zz' + kz) || n.startsWith(kz + 'verkauft') || n.endsWith('verkauft' + kz) || n === 'verkauft' + kz)) continue
          const basis = GEB + '/' + g + '/' + o.name
          for (const [teil, archiv] of [[AKTUELL, false], [ARCHIV, true]]) {
            const L = (await kinder(basis + '/' + teil)) || []
            for (const m of L.filter(m => m.ordner)) out.push({ pfad: basis + '/' + teil + '/' + m.name, name: m.name, archiv, web: m.web })
          }
          out.push({ basis, objekt: true })
        }
      }
      return antwort({ ordner: out.filter(o => !o.objekt), basis: (out.find(o => o.objekt) || {}).basis || '' })
    }

    if (a === 'akte') {
      // Unterordner eines Mieterordners mit ihren Dateien (eine Ebene tiefer für z. B. 03 Miete & Zahlungen/Mahnungen)
      const p = pruefe(b.pfad); const top = await kinder(p)
      if (!top) return antwort({ error: 'Ordner nicht gefunden: ' + p }, 404)
      const ordner = {}, dateien = top.filter(x => !x.ordner)
      for (const f of top.filter(x => x.ordner)) {
        const L = (await kinder(p + '/' + f.name)) || []
        ordner[f.name] = L.filter(x => !x.ordner)
        for (const u of L.filter(x => x.ordner)) ordner[f.name + '/' + u.name] = ((await kinder(p + '/' + f.name + '/' + u.name)) || []).filter(x => !x.ordner)
      }
      return antwort({ ordner, dateien })
    }

    if (a === 'objektordner') {
      // Objektordner eines Objekts mit den Unterordnern von 04 Betriebskosten, 05 Instandhaltung und 07 WEG (für die Belegablage)
      const kz = norm(b.kz); if (!kz) return antwort({ error: 'Objektkürzel fehlt.' }, 400)
      let treffer = null
      for (const g of GRUPPEN) {
        const objs = (await kinder(GEB + '/' + g)) || []
        for (const o of objs.filter(o => o.ordner)) {
          const n = norm(o.name)
          const genau = n === kz, verkauft = n.startsWith('zz' + kz) || n.startsWith(kz + 'verkauft') || n.endsWith('verkauft' + kz) || n === 'verkauft' + kz
          if (!genau && !verkauft) continue
          if (!treffer || (genau && !treffer.genau)) treffer = { basis: GEB + '/' + g + '/' + o.name, genau }
        }
      }
      if (!treffer) return antwort({ basis: '', top: [], unter: {} })
      const top = ((await kinder(treffer.basis)) || []).filter(x => x.ordner).map(x => x.name)
      const unter = {}
      for (const t of top.filter(t => /^0[457]\b/.test(t))) unter[t] = ((await kinder(treffer.basis + '/' + t)) || []).filter(x => x.ordner).map(x => x.name)
      return antwort({ basis: treffer.basis, top, unter })
    }

    if (a === 'inhalt') {
      // Datei für die Vorschau (bis 3 MB) als Base64
      const d = await drive(); const x = await graph('/drives/' + d + '/items/' + encodeURIComponent(b.id) + '?$select=id,name,size,file,parentReference,@microsoft.graph.downloadUrl')
      if (!(x.parentReference && decodeURIComponent(String(x.parentReference.path || '')).includes('/' + ROOT))) return antwort({ error: 'Datei nicht erlaubt.' }, 403)
      if ((x.size || 0) > 3 * 1024 * 1024) return antwort({ zuGross: true, name: x.name })
      const r = await fetch(x['@microsoft.graph.downloadUrl']); if (!r.ok) return antwort({ error: 'Datei nicht lesbar (' + r.status + ').' }, 500)
      const buf = Buffer.from(await r.arrayBuffer())
      return antwort({ name: x.name, typ: (x.file && x.file.mimeType) || '', daten: buf.toString('base64') })
    }

    if (a === 'belegbaum') {
      // Alle Belege eines Jahres: Gesellschaften Rechnungen und Barauslagen sowie je Objekt 04 Betriebskosten, 05 Instandhaltung und 07 WEG
      const jahr = String(b.jahr || '').replace(/\D/g, '').slice(0, 4); if (jahr.length !== 4) return antwort({ error: 'Jahr fehlt.' }, 400)
      const wunsch = new Set((b.kz || []).map(norm)); const dateien = []
      const imJahr = f => { const m = f.name.match(/(20\d{2})-\d{2}-\d{2}/) || f.name.match(/_(20\d{2})-\d{2}[_ .]/); return m ? m[1] === jahr : String(f.geaendert || '').slice(0, 4) === jahr }
      async function geh(pfad, rel, tiefe, info, filter) {
        const L = await kinder(pfad); if (!L) return
        await Promise.all(L.map(async x => {
          const r = rel ? rel + '/' + x.name : x.name
          if (x.ordner) { if (tiefe > 1 && !/abrechnung|altablage/i.test(x.name)) await geh(pfad + '/' + x.name, r, tiefe - 1, info, filter) }
          else if (!filter || filter(x)) dateien.push(Object.assign(x, info, { rel: r, pfad: pfad + '/' + x.name }))
        }))
      }
      const BF = ROOT + '/9.000 Buchführung'
      const auftraege = [
        geh(BF + '/Gesellschaften Rechnungen/' + jahr, '', 3, { bereich: 'ges' }),
        geh(BF + '/Gesellschaften Barauslagen/' + jahr, '', 2, { bereich: 'bar' })
      ]
      for (const g of GRUPPEN) {
        const objs = ((await kinder(GEB + '/' + g)) || []).filter(o => o.ordner)
        for (const o of objs) {
          const n = norm(o.name); const kz = [...wunsch].find(k => n === k); if (!kz) continue
          const basis = GEB + '/' + g + '/' + o.name
          auftraege.push((async () => {
            const top = ((await kinder(basis)) || []).filter(x => x.ordner)
            const t04 = top.find(x => x.name.startsWith('04 ')), t05 = top.find(x => x.name.startsWith('05 ')), t07 = top.find(x => x.name.startsWith('07 '))
            const info = { bereich: 'obj', obj: o.name }
            const jobs = []
            if (t04) jobs.push(geh(basis + '/' + t04.name, t04.name, 2, info, imJahr))
            if (t07) jobs.push(geh(basis + '/' + t07.name, t07.name, 2, info, imJahr))
            if (t05) { const L = ((await kinder(basis + '/' + t05.name)) || []).filter(x => x.ordner && x.name.includes(jahr))
              for (const u of L) jobs.push(geh(basis + '/' + t05.name + '/' + u.name, t05.name + '/' + u.name, 2, info)) }
            await Promise.all(jobs)
          })())
        }
      }
      await Promise.all(auftraege)
      return antwort({ dateien: dateien.filter(f => !/^~\$|\.(ds_store|tmp)$/i.test(f.name)) })
    }

    if (a === 'objektbasis') {
      // Objektordner aller Objekte mit ihren Hauptordnern (01 Objekt … 07 WEG)
      const wunsch = (b.kz || []).map(k => [k, norm(k)]); const out = {}
      await Promise.all(GRUPPEN.map(async g => {
        const objs = ((await kinder(GEB + '/' + g)) || []).filter(o => o.ordner)
        await Promise.all(objs.map(async o => {
          const w = wunsch.find(([, n]) => norm(o.name) === n); if (!w) return
          const basis = GEB + '/' + g + '/' + o.name
          out[w[0]] = { basis, gruppe: g, top: ((await kinder(basis)) || []).filter(x => x.ordner).map(x => x.name) }
        }))
      }))
      return antwort({ objekte: out })
    }

    if (a === 'ordner') {
      // Inhalt eines Ordners (Unterordner und Dateien), für die Ordneransicht im OS
      const p = pruefe(b.pfad); const L = await kinder(p)
      if (!L) return antwort({ fehlt: true, eintraege: [] })
      return antwort({ eintraege: L })
    }

    if (a === 'baum') {
      // Ordner rekursiv auflisten (max. 3 Ebenen), z. B. Kontoauszüge eines Jahres
      const p = pruefe(b.pfad); const tiefe = Math.min(3, Math.max(1, Number(b.tiefe) || 2)); const dateien = []
      async function geh(pfad, rel, t) {
        const L = await kinder(pfad); if (!L) return
        await Promise.all(L.map(async x => {
          const r = rel ? rel + '/' + x.name : x.name
          if (x.ordner) { if (t < tiefe) await geh(pfad + '/' + x.name, r, t + 1) } else dateien.push(Object.assign(x, { rel: r }))
        }))
      }
      await geh(p, '', 1)
      return antwort({ dateien })
    }

    if (a === 'anlegen') {
      // Ordner (mit allen Zwischenordnern) anlegen, z. B. neuer Mieterordner mit 01–06
      const d = await drive(); const p = pruefe(b.pfad); const teile = p.split('/'); let akt = ''
      for (const t of teile) {
        const naechst = akt ? akt + '/' + t : t
        const da = await graph('/drives/' + d + '/root:/' + enc(naechst), { erlaube404: true })
        if (!da) await graph(akt ? '/drives/' + d + '/root:/' + enc(akt) + ':/children' : '/drives/' + d + '/root/children', { method: 'POST', json: { name: t, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' } })
        akt = naechst
      }
      for (const u of (b.unterordner || [])) {
        const ziel = p + '/' + String(u).replace(/^\/+/, '')
        const da = await graph('/drives/' + d + '/root:/' + enc(pruefe(ziel)), { erlaube404: true })
        if (!da) { const par = ziel.split('/').slice(0, -1).join('/'); await graph('/drives/' + d + '/root:/' + enc(par) + ':/children', { method: 'POST', json: { name: ziel.split('/').pop(), folder: {}, '@microsoft.graph.conflictBehavior': 'fail' } }) }
      }
      return antwort({ ok: true, pfad: p })
    }

    if (a === 'hochladen') {
      // kleine Dateien (bis ca. 3 MB) direkt über den Server
      const d = await drive(); const p = pruefe(b.pfad); const name = String(b.name || '').replace(/[\\/:*?"<>|#%]/g, '_')
      if (!name) return antwort({ error: 'Dateiname fehlt.' }, 400)
      const bytes = Buffer.from(String(b.daten || ''), 'base64')
      const r = await graph('/drives/' + d + '/root:/' + enc(p + '/' + name) + ':/content?@microsoft.graph.conflictBehavior=rename', { method: 'PUT', body: bytes, headers: { 'content-type': b.typ || 'application/octet-stream' } })
      return antwort({ ok: true, item: item(r) })
    }

    if (a === 'sitzung') {
      // große Dateien: Upload-Sitzung, der Browser lädt direkt zu Microsoft hoch
      const d = await drive(); const p = pruefe(b.pfad); const name = String(b.name || '').replace(/[\\/:*?"<>|#%]/g, '_')
      const r = await graph('/drives/' + d + '/root:/' + enc(p + '/' + name) + ':/createUploadSession', { method: 'POST', json: { item: { '@microsoft.graph.conflictBehavior': 'rename' } } })
      return antwort({ uploadUrl: r.uploadUrl })
    }

    if (a === 'link') {
      const d = await drive(); const x = await graph('/drives/' + d + '/items/' + encodeURIComponent(b.id) + '?$select=id,name,webUrl,parentReference,@microsoft.graph.downloadUrl')
      if (!(x.parentReference && decodeURIComponent(String(x.parentReference.path || '')).includes('/' + ROOT))) return antwort({ error: 'Datei nicht erlaubt.' }, 403)
      return antwort({ web: x.webUrl, download: x['@microsoft.graph.downloadUrl'] })
    }

    if (a === 'loeschen') {
      const d = await drive(); const x = await graph('/drives/' + d + '/items/' + encodeURIComponent(b.id) + '?$select=id,parentReference,folder')
      if (x.folder || !(x.parentReference && decodeURIComponent(String(x.parentReference.path || '')).includes('/' + ROOT))) return antwort({ error: 'Löschen nicht erlaubt.' }, 403)
      await graph('/drives/' + d + '/items/' + encodeURIComponent(b.id), { method: 'DELETE' })
      return antwort({ ok: true })
    }

    return antwort({ error: 'Unbekannte Aktion.' }, 400)
  } catch (e) {
    const m = String(e && e.message || e)
    const hinweis = /access denied|accessdenied|forbidden|insufficient/i.test(m) ? ' – In Entra fehlt vermutlich die Berechtigung Sites.ReadWrite.All mit Administratorzustimmung.' : ''
    return antwort({ error: m + hinweis }, e.status === 404 ? 404 : 500)
  }
}
