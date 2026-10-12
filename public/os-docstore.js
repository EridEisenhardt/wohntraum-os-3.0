/* Wohntraum OS – Dokumentenspeicher für übernommene Claude-Artifacts.
   Stellt window.claude.use('db' | 'downloads' | 'user') bereit, gespeichert in Supabase (Tabelle os_docs).
   Jede Seite setzt vorher window.OS_APP (z. B. 'mw' oder 'oc'). */
(function(){
  const APP = window.OS_APP;
  const sb = window.supabase.createClient('https://jqzxctfqvcwbctpjksvg.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxenhjdGZxdmN3YmN0cGprc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzA0MzIsImV4cCI6MjA5NzcwNjQzMn0.RKIbZxJdusKWWPjBJqlxZ8e1m8So02UslOg55YRsn3o');
  const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function deepMerge(a, b){ const o = isObj(a) ? clone(a) : {}; for (const k in b){ o[k] = (isObj(b[k]) && isObj(o[k])) ? deepMerge(o[k], b[k]) : clone(b[k]); } return o; }

  const cache = {};            // pfad -> data
  const docL = {};             // pfad -> [fn]
  const colL = {};             // collection -> [fn]
  let ready = null;

  const snapDoc = p => ({ id: p.split('/').pop(), exists: cache[p] !== undefined, data: () => clone(cache[p]) });
  const snapCol = c => { const docs = Object.keys(cache).filter(p => p.startsWith(c + '/') && p.split('/').length === c.split('/').length + 1).sort()
      .map(p => ({ id: p.split('/').pop(), exists: true, data: () => clone(cache[p]) })); return { docs, size: docs.length, empty: !docs.length }; };
  function notify(p){ (docL[p] || []).forEach(f => { try { f(snapDoc(p)); } catch(e){ console.error(e); } });
    const c = p.split('/').slice(0, -1).join('/'); (colL[c] || []).forEach(f => { try { f(snapCol(c)); } catch(e){ console.error(e); } }); }

  async function loadAll(){
    let from = 0; const size = 500;
    for(;;){ const { data, error } = await sb.from('os_docs').select('pfad,data').eq('app', APP).range(from, from + size - 1);
      if (error) throw error; data.forEach(r => { cache[r.pfad] = r.data; }); if (data.length < size) break; from += size; }
    sb.channel('os_docs_' + APP).on('postgres_changes', { event: '*', schema: 'public', table: 'os_docs', filter: 'app=eq.' + APP }, ev => {
      const r = ev.new && ev.new.pfad ? ev.new : ev.old; if (!r || !r.pfad) return;
      if (ev.eventType === 'DELETE') delete cache[r.pfad]; else cache[r.pfad] = ev.new.data;
      notify(r.pfad); }).subscribe();
  }
  async function write(p, data){
    const { error } = await sb.from('os_docs').upsert({ app: APP, pfad: p, data, updated_at: new Date().toISOString() });
    if (error) { const e = new Error(error.message); e.code = 'unavailable'; throw e; }
    cache[p] = clone(data); notify(p);
  }
  async function fetchOne(p){ const { data, error } = await sb.from('os_docs').select('data').eq('app', APP).eq('pfad', p).maybeSingle(); if (error) throw error; return data ? data.data : undefined; }

  function doc(p){ return {
    id: p.split('/').pop(), path: p,
    async get(){ const d = await fetchOne(p); if (d === undefined) delete cache[p]; else cache[p] = d; return snapDoc(p); },
    set(data){ return write(p, clone(data)); },
    async update(patch){ const cur = await fetchOne(p); if (cur === undefined) { const e = new Error('Dokument existiert nicht'); e.code = 'not_found'; throw e; } return write(p, deepMerge(cur, patch)); },
    async delete(){ const { error } = await sb.from('os_docs').delete().eq('app', APP).eq('pfad', p); if (error) throw error; delete cache[p]; notify(p); },
    onSnapshot(fn, err){ (docL[p] = docL[p] || []).push(fn); ready.then(() => fn(snapDoc(p)), e => err && err(e)); return () => { docL[p] = (docL[p] || []).filter(x => x !== fn); }; }
  }; }
  function collection(c){ return {
    doc: id => doc(c + '/' + id),
    async get(){ return snapCol(c); },
    onSnapshot(fn, err){ (colL[c] = colL[c] || []).push(fn); ready.then(() => fn(snapCol(c)), e => err && err(e)); return () => { colL[c] = (colL[c] || []).filter(x => x !== fn); }; }
  }; }

  /* ---------- Import (Übernahme von Daten aus einer Import-Datei) ---------- */
  async function importFile(f, progress){
    const j = JSON.parse(await f.text()); if (j.app !== APP || !j.docs) throw new Error('Diese Datei gehört nicht zu dieser Seite.');
    const rows = Object.entries(j.docs).map(([pfad, data]) => ({ app: APP, pfad, data, updated_at: new Date().toISOString() }));
    for (let i = 0; i < rows.length; i += 25){ progress && progress('Übernehme ' + Math.min(i + 25, rows.length) + ' von ' + rows.length + ' …');
      const { error } = await sb.from('os_docs').upsert(rows.slice(i, i + 25)); if (error) throw error;
      rows.slice(i, i + 25).forEach(r => { cache[r.pfad] = r.data; notify(r.pfad); }); }
    return rows.length;
  }
  window.osImportFile = importFile;
  function importBox(){
    const box = document.createElement('div');
    box.style.cssText = 'max-width:1100px;margin:16px auto 0;padding:14px 16px;border:2px dashed #2f5d8a;border-radius:12px;background:#eef3f9;color:#1c2230;font:14px system-ui,sans-serif';
    box.innerHTML = '<b>Daten übernehmen</b><div style="margin:6px 0 10px;color:#555">Wähle die Import-Datei <code>' + APP + '_import.json</code> aus, die Claude aus dem bisherigen Artifact erstellt hat. Vorhandene Dokumente mit gleichem Namen werden überschrieben.</div><input type="file" accept=".json,application/json"> <span class="st" style="margin-left:8px"></span>';
    const st = box.querySelector('.st');
    box.querySelector('input').addEventListener('change', async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try { const n = await importFile(f, t => st.textContent = t);
        st.textContent = '✅ ' + n + ' Dokumente übernommen. Seite lädt neu …'; setTimeout(() => location.href = location.pathname, 1200);
      } catch(e){ st.textContent = '❌ ' + (e.message || e); }
    });
    document.body.insertBefore(box, document.body.firstChild);
  }

  ready = (async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { const e = new Error('Bitte im Wohntraum OS einloggen.'); e.code = 'not_signed_in'; throw e; }
    await loadAll();
    if (!Object.keys(cache).length || /[?&]import=1/.test(location.search)) { if (document.body) importBox(); else document.addEventListener('DOMContentLoaded', importBox); }
  })();
  ready.catch(e => { const show = () => { const v = document.getElementById('view'); if (v) v.innerHTML = '<div class="loading">' + (e.code === 'not_signed_in' ? 'Bitte im Wohntraum OS einloggen.' : 'Daten konnten nicht geladen werden: ' + (e.message || e)) + '</div>'; };
    setTimeout(show, 50); });

  window.osSupabase = sb;
  const db = Object.freeze({ doc, collection });
  const downloads = Object.freeze({ async save({ filename, data }){ const blob = data instanceof Blob ? data : new Blob([data], { type: /\.xlsx$/i.test(filename) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); } });
  const user = Object.freeze({ can: async () => true, canEdit: () => true, isOwner: () => true });

  window.claude = Object.freeze({ use: async name => {
    if (name === 'db') { try { await ready; return db; } catch(e){ return null; } }
    if (name === 'downloads') return downloads;
    if (name === 'user') return user;
    return null; } });
})();
