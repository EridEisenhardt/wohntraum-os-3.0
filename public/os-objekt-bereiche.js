/* Objektseite: Historie, Aufgaben (Asana), Anschreiben, Mails und Kosten – Aufbau wie im Mieterkonto.
   Gespeichert in os_docs (app 'oc'): objhist/, objbrief/, objmails/ (je Dokument mit kz).
   Nutzt aus der Objektseite: sb, esc, eur, dfmt, HEUTE, ROOT, OB, TEN, odApi, odOeffne, voll, odHochladen, jq, SECO. */
const NUTZER={'ramona@andersmacher.info':'Ramona','juergen@andersmacher.info':'Jürgen','eric@andersmacher.info':'Eric'};
const nutzerName=v=>{const k=String(v||'').toLowerCase().trim();return NUTZER[k]||v||'unbekannt';};
let ICH='',ICHID='',ICHMAIL='';
async function loadIch(){try{const {data:{user}}=await sb.auth.getUser();if(!user)return;let n=(user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||'';
  try{const {data}=await sb.from('profiles').select('full_name').eq('id',user.id).maybeSingle();if(data&&data.full_name)n=data.full_name;}catch(e){}
  ICHID=user.id;ICHMAIL=String(user.email||'').toLowerCase();ICH=NUTZER[ICHMAIL]||n||user.email||'';}catch(e){}}
async function apiPost(pfad,body,name){const tok=await token();let r;
  try{r=await fetch(pfad,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:JSON.stringify(body)});}catch(e){throw new Error(name+' nicht erreichbar.');}
  let j=null;try{j=await r.json();}catch(e){}if(!j)throw new Error(r.status===404?'Die '+name+'-Schnittstelle ist noch nicht online.':name+' nicht erreichbar ('+r.status+').');
  if(j.error){const e=new Error(j.error);e.setup=!!j.setup;throw e;}return j;}
async function docSet(pfad,data){const {error}=await sb.from('os_docs').upsert({app:'oc',pfad,data,updated_at:new Date().toISOString()});if(error)throw new Error(error.message);}
async function docsVon(prefix){const {data}=await sb.from('os_docs').select('data').eq('app','oc').like('pfad',prefix+'/%').eq('data->>kz',OB.kz);return (data||[]).map(r=>r.data).filter(Boolean);}
const kurzZeit=iso=>{const s=String(iso||'');if(s.length<=10)return dfmt(s);const d=new Date(s);if(isNaN(d))return dfmt(s.slice(0,10));const p=n=>String(n).padStart(2,'0');return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());};
function toast(t){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);}el.textContent=t;el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),3500);}
/* Eingabefeld mit Auswahlliste: beim Hineinklicken leeren, damit alle Einträge sichtbar sind */
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[data-wahl]')){t.dataset.alt=t.value;t.value='';}});
document.addEventListener('focusout',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[data-wahl]')&&!t.value&&t.dataset.alt){t.value=t.dataset.alt;t.dispatchEvent(new Event('input',{bubbles:true}));}});

/* ---------- Bereiche anlegen ---------- */
const BER=[['notiz','Notizen'],['hist','Historie'],['asana','Aufgaben (Asana)'],['brief','Anschreiben'],['mails','Mails'],['kosten','Kosten']];
let ON=[],OH=[],OBR=[],OML=[],MH=[],BLADE=false;
function bereicheInit(){const box=document.getElementById('uebBereiche');if(!box||box.dataset.ok)return;box.dataset.ok='1';
  box.innerHTML=BER.map(([k,t])=>`<details class="card sec" data-sec="${k}"${SECO[k]?' open':''}><summary class="ch">${t}<span class="sub" id="bs-${k}"></span></summary><div id="bx-${k}"><div class="sub">Lädt …</div></div></details>`).join('');
  if(typeof ueberOrdnen==='function')ueberOrdnen();
  bereicheLaden();}
async function bereicheLaden(){if(BLADE)return;BLADE=true;loadIch();
  const pids=[...new Set(TEN.filter(t=>t.quelle==='mk'&&t.pid).map(t=>t.pid))];
  const [n,h,b,m,mh]=await Promise.all([docsVon('objnotiz'),docsVon('objhist'),docsVon('objbrief'),docsVon('objmails'),
    pids.length?sb.from('os_docs').select('data').eq('app','oc').like('pfad','historie/%').in('data->>pid',pids).then(r=>(r.data||[]).map(x=>x.data)):Promise.resolve([])]);
  ON=n;OH=h;OBR=b;OML=m;MH=(mh||[]).filter(Boolean);
  rNotiz();rHist();rAsana();rBrief();rMails();rKosten();
  BER.forEach(([k])=>{if(SECO[k])bereichOeffnen(k);});}
function bereichOeffnen(k){if(k==='asana'&&!AS.L&&!AS.lade&&!AS.err)asLaden();if(k==='kosten')kostenOeffnen();}
async function objLog(art,t,d){if(!ICH)await loadIch();const ts=new Date(),lid=OB.kz+'__'+ts.getTime()+Math.random().toString(36).slice(2,5);
  const e={kz:OB.kz,id:lid,d:d||ts.toISOString(),erfasst:ts.toISOString(),art,t:String(t||''),by:ICH||'unbekannt',mail:ICHMAIL,uid:ICHID,manuell:!!d};
  try{await docSet('objhist/'+lid,e);OH.push(e);rHist();}catch(err){}}

/* ---------- Notizen mit KI (wie im Mieterkonto) ---------- */
let NDRAFT='',NOTF=[],NBUSY=false,NKI={busy:'',orig:null,fehler:''},NEDIT=null,NEDTXT='',NEKI=null,KURZ={},KBUSY='';
const eigen=n=>(ICHID&&n.uid===ICHID)||(ICHMAIL&&String(n.mail||n.by||'').toLowerCase()===ICHMAIL);
function kiKnoepfe(feld){const b=NKI.busy,orig=feld==='n-text'?NKI.orig:NEKI;
  return `<button class="ghost small" onclick="notizKi('verbessern','${feld}')"${b?' disabled':''}>${b===feld+'verbessern'?'KI arbeitet …':'Mit KI verbessern'}</button>`
    +`<button class="ghost small" onclick="notizKi('stichpunkte','${feld}')"${b?' disabled':''}>${b===feld+'stichpunkte'?'KI arbeitet …':'In Stichpunkte kürzen'}</button>`
    +(orig!=null?`<button class="ghost small" onclick="notizOrig('${feld}')">Original wiederherstellen</button>`:'')
    +(NKI.fehler?`<div class="note warnbox" style="flex-basis:100%">${esc(NKI.fehler)}</div>`:'');}
function rNotiz(){const box=document.getElementById('bx-notiz');if(!box)return;const L=ON.slice().sort((a,b)=>String(b.d).localeCompare(String(a.d)));
  document.getElementById('bs-notiz').textContent=L.length+' Eintr'+(L.length===1?'ag':'äge')+(L.length?' · zuletzt '+dfmt(String(L[0].d).slice(0,10)):'');
  let h=`<textarea id="n-text" class="inp" style="width:100%" rows="3" placeholder="Neue Notiz zum Objekt …" oninput="NDRAFT=this.value">${esc(NDRAFT)}</textarea>
    <div class="acts">${kiKnoepfe('n-text')}</div>
    <div class="acts"><label class="up">Datei anhängen<input type="file" multiple hidden onchange="NOTF=NOTF.concat([...this.files]);this.value='';rNotiz()"></label>${NOTF.length?`<span class="sub">${NOTF.map(f=>esc(f.name)).join(', ')}</span><button class="ghost small" onclick="NOTF=[];rNotiz()">Dateien entfernen</button>`:''}<button class="primary small" onclick="notizSpeichern()"${NBUSY?' disabled':''}>${NBUSY?'Speichere …':'Notiz speichern'}</button></div>
    <div class="sub">Gespeicherte Notizen erhalten Datum, Uhrzeit und Ersteller und können nur von dem bearbeitet oder gelöscht werden, der sie geschrieben hat. Dateien werden im Objektordner unter 01 Objekt / Notizen abgelegt.</div>`;
  for(const n of L){const dt=new Date(n.d),mein=eigen(n);
    h+=`<div class="note-e"><div class="note-h"><b>${esc(dt.toLocaleDateString('de-DE'))} ${esc(dt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}))}</b> · ${esc(nutzerName(n.mail||n.by))}${n.edited?` <span class="sub">(bearbeitet ${esc(new Date(n.edited).toLocaleDateString('de-DE'))})</span>`:''}${mein&&NEDIT!==n.id?` <button class="ghost small" onclick="NEDIT='${jq(n.id)}';NEDTXT=ON.find(x=>x.id===NEDIT).t||'';NEKI=null;rNotiz()">bearbeiten</button><button class="ghost small" onclick="notizLoeschen('${jq(n.id)}',this)">löschen</button>`:''}</div>`;
    if(NEDIT===n.id)h+=`<textarea id="ne-text" class="inp" style="width:100%" rows="5" oninput="NEDTXT=this.value">${esc(NEDTXT)}</textarea><div class="acts">${kiKnoepfe('ne-text')}</div><div class="acts"><button class="primary small" onclick="notizAendern()">Speichern</button><button class="ghost small" onclick="NEDIT=null;NEKI=null;rNotiz()">Abbrechen</button></div>`;
    else if(n.t){h+=`<div class="note-t">${esc(n.t)}</div>`;
      if(n.t.length>350)h+=`<div class="acts"><button class="ghost small" onclick="notizKurz('${jq(n.id)}')"${KBUSY===n.id?' disabled':''}>${KBUSY===n.id?'KI fasst zusammen …':KURZ[n.id]?'Kurzfassung ausblenden':'Kurzfassung (KI)'}</button></div>`+(KURZ[n.id]?`<div class="note-k">${esc(KURZ[n.id])}</div>`:'');}
    if((n.files||[]).length)h+=`<div class="note-f">${n.files.map(f=>f.web?`<a href="${esc(f.web)}" target="_blank" rel="noopener">${esc(f.n)}</a>`:esc(f.n)).join(' · ')}</div>`;
    h+='</div>';}
  if(OB.notizen)h+=`<div class="note-e"><div class="note-h"><b>Frühere Notiz</b> · ohne Datum</div><div class="note-t">${esc(OB.notizen)}</div></div>`;
  box.innerHTML=h;}
async function notizKi(aufgabe,feld){const ta=document.getElementById(feld),t=((ta&&ta.value)||'').trim();if(!t){toast('Bitte zuerst einen Text eingeben.');return;}
  NKI.busy=feld+aufgabe;NKI.fehler='';rNotiz();
  try{const r=await kiCall(aufgabe,t);if(feld==='n-text'){if(NKI.orig==null)NKI.orig=t;NDRAFT=r.text||t;}else{if(NEKI==null)NEKI=t;NEDTXT=r.text||t;}}
  catch(e){NKI.fehler=e.message||String(e);}NKI.busy='';rNotiz();}
function notizOrig(feld){if(feld==='n-text'){NDRAFT=NKI.orig||'';NKI.orig=null;}else{NEDTXT=NEKI||'';NEKI=null;}rNotiz();}
async function notizKurz(nid){const n=ON.find(x=>x.id===nid);if(!n)return;if(KURZ[nid]){delete KURZ[nid];rNotiz();return;}
  KBUSY=nid;rNotiz();try{KURZ[nid]=(await kiCall('stichpunkte',n.t)).text||'';}catch(e){KURZ[nid]='Fehler: '+(e.message||e);}KBUSY='';rNotiz();}
async function notizSpeichern(){if(NBUSY)return;const t=(NDRAFT||'').trim();if(!t&&!NOTF.length){toast('Bitte einen Text eingeben oder eine Datei anhängen.');return;}
  if(NOTF.length&&!OB.onedrive_pfad){toast('Für dieses Objekt ist kein OneDrive-Ordner hinterlegt, Dateien können nicht abgelegt werden.');return;}
  if(!ICH)await loadIch();NBUSY=true;rNotiz();const ts=new Date(),nid=OB.kz+'__'+ts.getTime(),files=[];
  try{for(const f of NOTF){const it=await odHochladen(OB.onedrive_pfad+'/01 Objekt/Notizen',OB.kz+'_'+HEUTE+'_'+f.name,f);files.push({n:it.name,web:it.web||'',id:it.id||''});}
    const e={kz:OB.kz,id:nid,d:ts.toISOString(),by:ICH||'unbekannt',mail:ICHMAIL,uid:ICHID,t,files};
    await docSet('objnotiz/'+nid,e);ON.push(e);NDRAFT='';NOTF=[];NKI={busy:'',orig:null,fehler:''};toast('Notiz gespeichert.');rHist();}
  catch(err){toast('Notiz nicht gespeichert: '+(err.message||err));}NBUSY=false;rNotiz();}
async function notizAendern(){const n=ON.find(x=>x.id===NEDIT);if(!n||!eigen(n)){toast('Nur der Verfasser kann diese Notiz bearbeiten.');return;}const t=(NEDTXT||'').trim();if(!t&&!(n.files||[]).length){toast('Bitte einen Text eingeben.');return;}
  const neu=Object.assign({},n,{t,edited:new Date().toISOString()});
  try{await docSet('objnotiz/'+n.id,neu);ON=ON.map(x=>x.id===n.id?neu:x);NEDIT=null;NEKI=null;delete KURZ[n.id];toast('Notiz geändert.');rNotiz();rHist();}catch(err){toast('Ändern nicht möglich: '+(err.message||err));}}
async function notizLoeschen(nid,btn){const n=ON.find(x=>x.id===nid);if(!n||!eigen(n)){toast('Nur der Verfasser kann diese Notiz löschen.');return;}
  if(btn.dataset.sure!=='1'){btn.dataset.sure='1';btn.textContent='wirklich löschen?';return;}
  const {error}=await sb.from('os_docs').delete().eq('app','oc').eq('pfad','objnotiz/'+nid);if(error){toast('Löschen nicht möglich: '+error.message);return;}ON=ON.filter(x=>x.id!==nid);rNotiz();rHist();}

/* ---------- Historie ---------- */
const HIST_ARTEN=['Anruf eingehend','Anruf ausgehend','Gespräch vor Ort','Termin / Besichtigung','Handwerker / Dienstleister','Behörde / Versorger','SMS / WhatsApp','Brief per Post','Sonstiges'];
let HF={art:'alle',mehr:false,neu:false,busy:false};
const pidName=pid=>{const t=TEN.find(x=>x.pid===pid);return t?t.mieter_name:'Mieter';};
const hGruppe=e=>e.mieter?'mieter':/^Anruf/.test(e.art)?'anruf':/^Mail/.test(e.art)?'mail':e.art==='Anschreiben'?'brief':e.art==='Aufgabe'?'aufgabe':e.art==='Notiz'?'notiz':e.art==='Dokument'?'dokument':/^(Gespräch|Termin|Handwerker|Behörde|SMS|Brief per|Sonstiges)/.test(e.art)?'kontakt':'aenderung';
function histListe(){const L=[];
  for(const n of ON)L.push({d:n.d,art:'Notiz',t:n.t+((n.files||[]).length?' (mit '+n.files.length+' Datei'+(n.files.length===1?'':'en')+')':''),by:n.by});
  for(const h of OH)L.push({d:h.d,art:h.art,t:h.t,by:h.by,id:h.id,eigen:h.manuell&&(h.uid===ICHID||String(h.mail||'').toLowerCase()===ICHMAIL)});
  for(const a of OBR)L.push({d:a.d,art:'Anschreiben',t:(a.betreff||'')+(a.zielText?' – an '+a.zielText:''),by:a.by});
  for(const m of OML)L.push({d:m.d,art:'Mail '+(m.richtung||''),t:m.betreff||'(ohne Betreff)',by:m.by});
  for(const h of MH)L.push({d:h.d,art:h.art||'Änderung',t:pidName(h.pid)+': '+(h.t||''),by:h.by,mieter:true});
  return L.sort((a,b)=>String(b.d).localeCompare(String(a.d)));}
function rHist(){const box=document.getElementById('bx-hist');if(!box)return;const L=histListe(),F=HF.art==='alle'?L:L.filter(e=>hGruppe(e)===HF.art);
  document.getElementById('bs-hist').textContent=L.length+' Eintr'+(L.length===1?'ag':'äge')+(L.length?' · zuletzt '+kurzZeit(L[0].d)+(L[0].by?' von '+nutzerName(L[0].by):''):'');
  const G=[['alle','Alle'],['kontakt','Gespräche / Termine'],['anruf','Anrufe'],['notiz','Notizen'],['aenderung','Änderungen'],['dokument','Dokumente'],['aufgabe','Aufgaben'],['brief','Anschreiben'],['mail','Mails'],['mieter','Mieter']].filter(([k])=>k==='alle'||L.some(e=>hGruppe(e)===k));
  const jetzt=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16);
  let h='<div class="acts" style="margin-top:0">'+G.map(([k,n])=>`<button class="${HF.art===k?'primary':'ghost'} small" onclick="HF.art='${k}';HF.mehr=false;rHist()">${n}</button>`).join('')+`<button class="small" style="margin-left:auto" onclick="HF.neu=!HF.neu;rHist()">${HF.neu?'Abbrechen':'Eintrag hinzufügen'}</button></div>`;
  if(HF.neu)h+=`<div class="hneu"><div class="hrow"><label class="fl" style="flex:1">Art<input id="h-art" data-wahl="1" list="h-artl" value="${esc(HIST_ARTEN[0])}"><datalist id="h-artl">${HIST_ARTEN.map(a=>`<option value="${esc(a)}">`).join('')}</datalist></label><label class="fl">Datum und Uhrzeit<input type="datetime-local" id="h-d" value="${jetzt}"></label></div>
    <textarea id="h-t" class="inp" style="width:100%" rows="2" placeholder="Was wurde besprochen oder vereinbart?"></textarea><div class="acts"><button class="primary small" onclick="histSpeichern()"${HF.busy?' disabled':''}>Speichern</button><span class="sub">Name und Uhrzeit werden automatisch festgehalten.</span></div></div>`;
  if(!F.length)h+='<div class="sub">Noch keine Einträge.</div>';
  const S=HF.mehr?F:F.slice(0,25);
  h+='<div class="hlist">'+S.map(e=>`<div class="hz"><div class="hk"><span class="hd">${esc(kurzZeit(e.d))}</span><span class="hw">${esc(nutzerName(e.by))}</span></div><div class="hb"><b>${esc(e.mieter?'Mieter · '+e.art:e.art)}</b>${e.t?' – '+esc(String(e.t).length>240?String(e.t).slice(0,240)+' …':e.t):''}${e.eigen?` <button class="ghost small" onclick="histLoeschen('${jq(e.id)}',this)">löschen</button>`:''}</div></div>`).join('')+'</div>';
  if(F.length>S.length)h+=`<button class="ghost small" onclick="HF.mehr=true;rHist()">Alle ${F.length} Einträge anzeigen</button>`;
  h+='<div class="sub" style="margin-top:6px">Enthält Änderungen am Objekt, Dokumente, Aufgaben, Anschreiben, Mails und die Historie der Mieter dieses Objekts.</div>';
  box.innerHTML=h;}
async function histSpeichern(){const t=(document.getElementById('h-t').value||'').trim(),art=(document.getElementById('h-art').value||'').trim()||'Sonstiges',dv=document.getElementById('h-d').value;
  if(!t){toast('Bitte kurz beschreiben, worum es ging.');return;}if(!dv){toast('Bitte Datum und Uhrzeit angeben.');return;}
  HF.busy=true;await objLog(art,t,new Date(dv).toISOString());HF.busy=false;HF.neu=false;toast('Eintrag gespeichert.');rHist();}
async function histLoeschen(hid,btn){if(btn.dataset.sure!=='1'){btn.dataset.sure='1';btn.textContent='wirklich löschen?';return;}
  const {error}=await sb.from('os_docs').delete().eq('app','oc').eq('pfad','objhist/'+hid);if(error){toast('Löschen nicht möglich: '+error.message);return;}OH=OH.filter(x=>x.id!==hid);rHist();}

/* ---------- Aufgaben aus Asana ---------- */
let AS={L:null,lade:false,err:''},ASP=null,ASU=null,ASF={neu:false,titel:'',projName:'',userName:'',due:'',notiz:'',busy:false};
const strasseName=()=>String(OB.strasse||'').replace(/\s*\d+\s*[a-z]?$/i,'').trim();
const kzRe=()=>new RegExp('(^|[^a-z0-9])'+String(OB.kz).toLowerCase().replace(/[^a-z0-9]/g,'')+'([^a-z0-9]|$)');
function asBegriffe(){const b=[];if(String(OB.kz).length>=3)b.push(OB.kz);else b.push(OB.kz+'_');const s=strasseName();if(s.length>=4)b.push(s);return b;}
async function asLaden(){AS.lade=true;AS.err='';rAsana();
  try{const j=await apiPost('/api/asana',{aktion:'suche',begriffe:asBegriffe()},'Asana');const re=kzRe(),st=strasseName().toLowerCase();
    const L=(j.aufgaben||[]).filter(a=>{const n=String(a.name||'').toLowerCase(),t=String(a.notiz||'').toLowerCase();return re.test(n)||(st.length>=4&&(n.includes(st)||t.includes(st)))||re.test(t.slice(0,300));});
    L.sort((a,b)=>(a.erledigt-b.erledigt)||String(b.geaendert).localeCompare(String(a.geaendert)));AS={L,lade:false,err:''};}
  catch(e){AS={L:null,lade:false,err:e.message||String(e),setup:!!e.setup};}
  rAsana();}
async function asListen(){try{if(!ASP)ASP=(await apiPost('/api/asana',{aktion:'projekte'},'Asana')).projekte||[];}catch(e){ASP=[];}
  try{if(!ASU)ASU=(await apiPost('/api/asana',{aktion:'nutzer'},'Asana')).nutzer||[];}catch(e){ASU=[];}rAsana();}
function rAsana(){const box=document.getElementById('bx-asana');if(!box)return;const L=AS.L||[],off=L.filter(a=>!a.erledigt),fertig=L.filter(a=>a.erledigt);
  document.getElementById('bs-asana').textContent=AS.lade&&!AS.L?'lädt …':AS.err?'nicht verbunden':AS.L?off.length+' offen'+(fertig.length?' · '+fertig.length+' erledigt':''):'aufklappen zum Laden';
  let h=`<div class="acts" style="margin-top:0"><button class="ghost small" onclick="asLaden()"${AS.lade?' disabled':''}>${AS.lade?'Lädt …':'Aktualisieren'}</button><button class="small" style="margin-left:auto" onclick="asFormular()">${ASF.neu?'Abbrechen':'Neue Aufgabe in Asana'}</button></div>`;
  if(AS.err)h+=`<div class="note warnbox">${esc(AS.err)}${AS.setup?'<br>Sobald das Asana-Token in Vercel hinterlegt ist, erscheinen hier die Aufgaben.':''}</div>`;
  if(ASF.neu)h+=`<div class="hneu"><label class="fl">Titel<input id="as-titel" value="${esc(ASF.titel)}" oninput="ASF.titel=this.value"></label>
    <div class="hrow"><label class="fl" style="flex:2">Projekt<input id="as-proj" data-wahl="1" list="as-projl" value="${esc(ASF.projName)}" oninput="ASF.projName=this.value" placeholder="${ASP?'Projektname eintippen, leer = ohne Projekt':'Lade Projekte …'}"><datalist id="as-projl">${(ASP||[]).map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist></label>
    <label class="fl" style="flex:1">Zuständig<input id="as-user" data-wahl="1" list="as-userl" value="${esc(ASF.userName)}" oninput="ASF.userName=this.value" placeholder="${ASU?'Name eintippen, leer = niemand':'Lade Personen …'}"><datalist id="as-userl">${(ASU||[]).map(u=>`<option value="${esc(u.name)}">`).join('')}</datalist></label>
    <label class="fl">Fällig am<input type="date" value="${esc(ASF.due)}" onchange="ASF.due=this.value"></label></div>
    <textarea class="inp" style="width:100%" rows="3" placeholder="Beschreibung (optional)" oninput="ASF.notiz=this.value">${esc(ASF.notiz)}</textarea>
    <div class="acts"><button class="primary small" onclick="asSpeichern()"${ASF.busy?' disabled':''}>${ASF.busy?'Lege an …':'In Asana anlegen'}</button><span class="sub">Objekt und Adresse werden automatisch in die Beschreibung übernommen.</span></div></div>`;
  const zeile=a=>`<div class="kvr" style="align-items:flex-start"><span style="display:flex;gap:8px;align-items:flex-start;white-space:normal;color:var(--ink)"><input type="checkbox" onchange="asErledigt('${jq(a.gid)}',this)"${a.erledigt?' checked':''} style="margin-top:3px"><span><span>${esc(a.name)}</span>
    <div class="sub">${esc([(a.projekte||[]).join(', ')+(a.abschnitt&&a.abschnitt!=='Unbenannter Abschnitt'?' · '+a.abschnitt:''),a.zustaendig?'zuständig: '+a.zustaendig:'',a.erledigt?(a.erledigtAm?'erledigt am '+dfmt(a.erledigtAm.slice(0,10)):'erledigt'):a.faellig?'fällig '+dfmt(a.faellig):''].filter(Boolean).join(' · '))}</div></span></span>
    <b><a href="${esc(a.link)}" target="_blank" rel="noopener" class="lnk">In Asana öffnen</a></b></div>`;
  if(AS.L&&!L.length)h+='<div class="sub">Keine Aufgaben zu diesem Objekt in Asana gefunden.</div>';
  h+=off.map(zeile).join('');
  if(fertig.length)h+=`<details style="margin-top:8px"><summary class="sub" style="cursor:pointer">${fertig.length} erledigte Aufgabe${fertig.length===1?'':'n'}</summary>${fertig.map(zeile).join('')}</details>`;
  h+=`<div class="sub" style="margin-top:6px">Gesucht wird in Asana nach: ${esc(asBegriffe().join(', '))}. Aufgaben am besten nach dem Muster „${esc(OB.kz)}_Thema“ benennen, dann werden sie sicher gefunden.</div>`;
  box.innerHTML=h;}
function asFormular(){ASF=Object.assign({},ASF,{neu:!ASF.neu,titel:ASF.neu?'':OB.kz+'_',notiz:'',due:''});if(ASF.neu)asListen();rAsana();}
async function asSpeichern(){const titel=String(ASF.titel||'').trim();if(!titel){toast('Bitte einen Titel eingeben.');return;}
  const p=(ASP||[]).find(q=>q.name===ASF.projName),u=(ASU||[]).find(q=>q.name===ASF.userName);
  if(ASF.projName&&!p){toast('Projekt nicht gefunden – bitte einen Eintrag aus der Liste wählen oder das Feld leeren.');return;}
  if(ASF.userName&&!u){toast('Person nicht gefunden – bitte einen Eintrag aus der Liste wählen oder das Feld leeren.');return;}
  if(!ICH)await loadIch();
  const notiz=(ASF.notiz?ASF.notiz+'\n\n':'')+'Objekt: '+OB.kz+' · '+(OB.display_address||'')+'\nAngelegt im Wohntraum OS (Objekt) von '+(ICH||'')+' am '+dfmt(HEUTE);
  ASF.busy=true;rAsana();
  try{const j=await apiPost('/api/asana',{aktion:'anlegen',name:titel,projekt:p?p.gid:'',faellig:ASF.due,zustaendig:u?u.gid:'',tags:[],notiz},'Asana');
    AS.L=[j.aufgabe].concat(AS.L||[]);ASF={neu:false,titel:'',projName:ASF.projName,userName:'',due:'',notiz:'',busy:false};objLog('Aufgabe','Asana-Aufgabe angelegt: '+titel);toast('Aufgabe in Asana angelegt.');}
  catch(e){ASF.busy=false;toast(e.message||String(e));}rAsana();}
async function asErledigt(gid,cb){const wert=cb.checked;
  try{const j=await apiPost('/api/asana',{aktion:'erledigt',gid,wert},'Asana');AS.L=(AS.L||[]).map(a=>a.gid===gid?Object.assign(a,j.aufgabe):a);objLog('Aufgabe','Asana-Aufgabe '+(wert?'erledigt':'wieder geöffnet')+': '+j.aufgabe.name);toast(wert?'In Asana als erledigt markiert.':'In Asana wieder geöffnet.');}
  catch(e){cb.checked=!wert;toast(e.message||String(e));}rAsana();}

/* ---------- Anschreiben (Aushang an alle Mieter, ein Brief je Mieter oder an einen Empfänger) ---------- */
const INHABER={EE:'Eric Eisenhardt',WT:'Wohn(T)raum Rheinhessen GmbH',KiBo:'Wohn(T)raum Rheinhessen GmbH'};
const ABS=' · Dalheimer Straße 70 · 55278 Dexheim';
const ZIEL_AUSHANG='Aushang an alle Mieter',ZIEL_ALLE='Alle Mieter einzeln (ein Brief je Mieter)',ZIEL_FREI='Anderer Empfänger';
let AB={ziel:ZIEL_AUSHANG,empf:'',betreff:'',entwurf:'',phase:'eingabe',text:'',ki:false,busy:'',fehler:''};
function aktMieter(){const ids=new Set(EIN.filter(u=>u.aktiv).map(u=>u.id));return TEN.filter(t=>ids.has(t.einheit_id)&&aktuell(t));}
function mLabel(t){const u=EIN.find(x=>x.id===t.einheit_id);return (u?u.bezeichnung+' · ':'')+(t.mieter_name||'Mieter');}
function mAdresse(t){const u=EIN.find(x=>x.id===t.einheit_id);const we=u&&!/efh|haus/i.test(u.bezeichnung+' '+(u.art||''))?', '+u.bezeichnung:'';return [t.mieter_name||'',(OB.strasse||'')+we,[OB.plz,OB.ort].filter(Boolean).join(' ')].filter(Boolean).join('\n');}
function mAnrede(t){const pid=t.pid,e=(pid&&MKE[pid])||{},an=String(e.anrede||'').trim();
  if(an){if(/^(sehr|liebe|hallo|guten)/i.test(an))return an.replace(/,?$/,',');return an.split(/\s*(?:,|\bund\b)\s*/).filter(Boolean).map((x,i)=>(i?'s':'S')+'ehr geehrte'+(/^herr/i.test(x)?'r ':' ')+x).join(', ')+',';}
  return 'Guten Tag '+(t.mieter_name||'')+',';}
function zielAnrede(){if(AB.ziel===ZIEL_AUSHANG||AB.ziel===ZIEL_ALLE)return 'Liebe Mieterinnen und Mieter,';const t=aktMieter().find(x=>mLabel(x)===AB.ziel);return t?mAnrede(t):'Sehr geehrte Damen und Herren,';}
function zielWahl(v){AB.ziel=v;const t=aktMieter().find(x=>mLabel(x)===v);if(t)AB.empf=mAdresse(t);else if(v===ZIEL_AUSHANG||v===ZIEL_ALLE)AB.empf='';rBrief();}
const ohneAnrede=t=>String(t||'').replace(/^\s*(sehr geehrte|liebe|hallo|guten tag)[^\n]*\n+/i,'');
function briefSeiten(){const body=AB.text.trim();
  if(AB.ziel===ZIEL_ALLE)return aktMieter().map(t=>({empf:mAdresse(t),text:mAnrede(t)+'\n\n'+ohneAnrede(body)}));
  return [{empf:AB.ziel===ZIEL_AUSHANG?'':AB.empf,text:body,aushang:AB.ziel===ZIEL_AUSHANG}];}
function briefPdf(){if(!window.jspdf){toast('PDF-Bibliothek lädt noch, bitte gleich nochmal.');return null;}
  const inh=INHABER[OB.gesellschaft]||INHABER.WT,doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),L=25,R=185;
  briefSeiten().forEach((S,i)=>{if(i)doc.addPage();let y=22;
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(120);doc.text(inh+ABS,L,y);y+=12;
    doc.setTextColor(20);doc.setFontSize(11);
    if(S.aushang){doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('Aushang',L,y+8);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text('An alle Mieterinnen und Mieter · '+(OB.display_address||''),L,y+15);y+=22;}
    else String(S.empf||'').split('\n').filter(s=>s.trim()).forEach(l=>{doc.text(l.trim(),L,y);y+=5;});
    y=Math.max(y,62)+8;doc.setFontSize(9);doc.setTextColor(90);doc.text('Dexheim, '+dfmt(HEUTE),R,y,{align:'right'});
    y+=12;doc.setTextColor(20);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.splitTextToSize(AB.betreff||'',R-L).forEach(l=>{doc.text(l,L,y);y+=6;});doc.setFont('helvetica','normal');y+=4;doc.setFontSize(10.5);
    const para=t=>{doc.splitTextToSize(t,R-L).forEach(ln=>{if(y>275){doc.addPage();y=22;}doc.text(ln,L,y);y+=5.4;});y+=3;};
    String(S.text||'').replace(/\r/g,'').split(/\n\s*\n/).forEach(p=>para(p.trim()));y+=2;para('Mit freundlichen Grüßen\n'+inh);});
  return doc;}
const briefName=()=>OB.kz+'_'+HEUTE+'_'+(AB.ziel===ZIEL_AUSHANG?'Aushang ':'Anschreiben ')+String(AB.betreff||'ohne Betreff').replace(/[\/\\]/g,'-').slice(0,60).trim()+'.pdf';
function rBrief(){const box=document.getElementById('bx-brief');if(!box)return;const L=OBR.slice().sort((a,b)=>String(b.d).localeCompare(String(a.d)));
  document.getElementById('bs-brief').textContent=L.length+' erstellt'+(L.length?' · zuletzt '+dfmt(String(L[0].d).slice(0,10)):'');
  const opts=[ZIEL_AUSHANG,ZIEL_ALLE].concat(aktMieter().map(mLabel)).concat([ZIEL_FREI]);
  let h='';
  if(AB.phase==='eingabe'){
    h+=`<div class="hrow"><label class="fl" style="flex:1">Empfänger<input data-wahl="1" list="ab-zl" value="${esc(AB.ziel)}" onchange="zielWahl(this.value)"><datalist id="ab-zl">${opts.map(o=>`<option value="${esc(o)}">`).join('')}</datalist></label>
      <label class="fl" style="flex:1">Betreff (optional – die KI schlägt sonst einen vor)<input value="${esc(AB.betreff)}" oninput="AB.betreff=this.value" placeholder="z. B. Treppenhausreinigung"></label></div>
      <label class="fl">Ihr Text – Stichworte oder Entwurf<textarea class="inp" style="width:100%" rows="5" oninput="AB.entwurf=this.value" placeholder="Was sollen die Empfänger erfahren? Die KI formuliert daraus einen Brief.">${esc(AB.entwurf)}</textarea></label>
      <div class="acts"><button class="primary small" onclick="abKi()"${AB.busy?' disabled':''}>${AB.busy==='ki'?'KI formuliert …':'Mit KI formulieren'}</button><button class="ghost small" onclick="abDirekt()">Ohne KI übernehmen</button></div>
      ${AB.fehler?`<div class="note warnbox">${esc(AB.fehler)}</div>`:''}<div class="sub">${AB.ziel===ZIEL_ALLE?'Es entsteht ein PDF mit einem Brief je Mieter ('+aktMieter().length+' Mieter), jeweils mit eigener Anrede und Adresse.':AB.ziel===ZIEL_AUSHANG?'Es entsteht ein Aushang für das Treppenhaus.':'Danach siehst du den fertigen Brief und kannst alles noch ändern.'}</div>`;
  }else{
    h+=`<div class="sub">${AB.ki?'Vorschlag der KI – bitte prüfen und bei Bedarf ändern.':'Brief prüfen und bei Bedarf ändern.'} Briefkopf, Datum und Grußformel ergänzt das System.</div>
      ${AB.ziel===ZIEL_AUSHANG||AB.ziel===ZIEL_ALLE?`<div class="kvr"><span>Empfänger</span><b>${esc(AB.ziel)}</b></div>`:`<label class="fl">Empfänger<textarea class="inp" style="width:100%" rows="3" oninput="AB.empf=this.value">${esc(AB.empf)}</textarea></label>`}
      <label class="fl">Betreff<input value="${esc(AB.betreff)}" oninput="AB.betreff=this.value"></label>
      <label class="fl">Brieftext<textarea class="inp" style="width:100%" rows="12" oninput="AB.text=this.value">${esc(AB.text)}</textarea></label>
      <div class="acts"><button class="primary small" onclick="abSpeichern()"${AB.busy?' disabled':''}>${AB.busy==='save'?'Speichere …':'PDF erstellen und ablegen'}</button><button class="ghost small" onclick="abVorschau()">Vorschau</button><button class="ghost small" onclick="AB.phase='eingabe';rBrief()">Zurück zum Entwurf</button><button class="ghost small" onclick="abVerwerfen(this)">Verwerfen</button></div>
      <div class="sub">Das PDF wird im Objektordner unter 02 Mieter / 04 Aushänge &amp; Anschreiben abgelegt als: ${esc(briefName())}</div>`;}
  h+='<div class="rh" style="margin-top:12px">Erstellte Anschreiben</div>';
  h+=L.length?'<table class="mini">'+L.map(a=>`<tr><td>${esc(dfmt(String(a.d).slice(0,10)))}</td><td>${a.web?`<a href="${esc(a.web)}" target="_blank" rel="noopener">${esc(a.betreff||'ohne Betreff')}</a>`:esc(a.betreff||'ohne Betreff')}</td><td class="sub">${esc(a.zielText||'')}</td><td class="sub">${esc(nutzerName(a.mail||a.by))}</td></tr>`).join('')+'</table>':'<div class="sub">Noch keine Anschreiben erstellt.</div>';
  box.innerHTML=h;}
async function kiCall(aufgabe,text,kontext){return apiPost('/api/ki',{aufgabe,text,kontext},'KI');}
async function abKi(){if(!AB.entwurf.trim()){toast('Bitte zuerst einen Text oder Stichworte eingeben.');return;}
  if(AB.ziel===ZIEL_FREI&&!AB.empf.trim())AB.empf='';
  AB.busy='ki';AB.fehler='';rBrief();
  try{const r=await kiCall('brief',AB.entwurf,{anrede:zielAnrede(),mieter:AB.ziel===ZIEL_AUSHANG||AB.ziel===ZIEL_ALLE?'alle Mieter des Hauses':AB.ziel,objekt:OB.kz+' '+(OB.display_address||''),betreff:AB.betreff});
    AB.text=r.text||'';if(r.betreff&&!AB.betreff.trim())AB.betreff=r.betreff;AB.phase='vorschau';AB.ki=true;}
  catch(e){AB.fehler=e.message||String(e);}AB.busy='';rBrief();}
function abDirekt(){if(!AB.entwurf.trim()){toast('Bitte zuerst einen Text eingeben.');return;}
  AB.text=(/^(sehr|liebe|hallo|guten)/i.test(AB.entwurf.trim())?'':zielAnrede()+'\n\n')+AB.entwurf.trim();AB.phase='vorschau';AB.ki=false;rBrief();}
function abVorschau(){const d=briefPdf();if(!d)return;const w=window.open(URL.createObjectURL(d.output('blob')),'_blank');if(!w)d.save(briefName());}
function abVerwerfen(b){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='Wirklich verwerfen?';return;}AB=Object.assign(AB,{betreff:'',entwurf:'',phase:'eingabe',text:'',ki:false});rBrief();}
async function abSpeichern(){if(AB.busy)return;if(!AB.betreff.trim()){toast('Bitte einen Betreff eingeben.');return;}if(!AB.text.trim()){toast('Der Brieftext ist leer.');return;}
  if(AB.ziel===ZIEL_ALLE&&!aktMieter().length){toast('Es gibt keine laufenden Mieter.');return;}
  const doc=briefPdf();if(!doc)return;if(!ICH)await loadIch();AB.busy='save';rBrief();
  const ts=new Date(),bid=OB.kz+'__'+ts.getTime(),name=briefName();let it=null;
  try{if(OB.onedrive_pfad)it=await odHochladen(OB.onedrive_pfad+'/02 Mieter/04 Aushänge & Anschreiben',name,doc.output('blob'));
    const zt=AB.ziel===ZIEL_FREI?String(AB.empf||'').split('\n')[0]:AB.ziel;
    const e={kz:OB.kz,id:bid,d:ts.toISOString(),by:ICH||'unbekannt',mail:ICHMAIL,uid:ICHID,betreff:AB.betreff.trim(),text:AB.text.trim(),empf:AB.empf,ziel:AB.ziel,zielText:zt,datei:it?it.name:name,odId:it?it.id:'',web:it?it.web:'',ki:!!AB.ki};
    await docSet('objbrief/'+bid,e);OBR.push(e);doc.save(it?it.name:name);
    toast('Anschreiben erstellt'+(it?' und in OneDrive abgelegt.':'.'));AB=Object.assign(AB,{betreff:'',entwurf:'',phase:'eingabe',text:'',ki:false});rHist();}
  catch(err){toast('Ablage fehlgeschlagen: '+(err.message||err));}AB.busy='';rBrief();}

/* ---------- Mails zum Objekt (Outlook über /api/mails oder .eml-Dateien) ---------- */
let MLS={res:null,busy:'',fehler:[],offen:{}};
const mlHash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36);};
function mlBegriffe(){const b=[];if(OB.strasse)b.push(OB.strasse);if(String(OB.kz).length>=3)b.push(OB.kz);return b;}
function emlDecodeWords(s){return String(s||'').replace(/(\?=)\s+(=\?)/g,'$1$2').replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,(m,cs,en,t)=>{try{let bytes;if(/b/i.test(en))bytes=Uint8Array.from(atob(t),c=>c.charCodeAt(0));else{const q=t.replace(/_/g,' ').replace(/=([0-9A-F]{2})/gi,(m2,x)=>String.fromCharCode(parseInt(x,16)));bytes=Uint8Array.from(q,c=>c.charCodeAt(0));}return new TextDecoder(cs.toLowerCase()).decode(bytes);}catch(e){return t;}});}
function emlTeil(raw){const i=raw.search(/\r?\n\r?\n/);const head=(i<0?raw:raw.slice(0,i)).replace(/\r?\n[ \t]+/g,' '),body=i<0?'':raw.slice(i).replace(/^\r?\n\r?\n/,'');const H={};
  for(const l of head.split(/\r?\n/)){const m=l.match(/^([\w-]+):\s*(.*)$/);if(m&&H[m[1].toLowerCase()]==null)H[m[1].toLowerCase()]=m[2];}return {H,body};}
function emlText(raw,tiefe){const {H,body}=emlTeil(raw);const ct=H['content-type']||'text/plain';tiefe=tiefe||0;const bm=ct.match(/boundary="?([^";]+)"?/i);
  if(/multipart\//i.test(ct)&&bm&&tiefe<5){const parts=body.split('--'+bm[1]).slice(1).filter(p=>!/^--/.test(p));let html='';for(const p of parts){const t=emlText(p.replace(/^\r?\n/,''),tiefe+1);if(t.plain)return t;if(t.html&&!html)html=t.html;}return {html};}
  const cs=(ct.match(/charset="?([^";]+)"?/i)||[])[1]||'utf-8',te=(H['content-transfer-encoding']||'').toLowerCase();let bytes;
  if(te==='base64'){try{bytes=Uint8Array.from(atob(body.replace(/\s+/g,'')),c=>c.charCodeAt(0));}catch(e){bytes=null;}}
  else if(te==='quoted-printable'){const q=body.replace(/=\r?\n/g,'').replace(/=([0-9A-F]{2})/gi,(m,x)=>String.fromCharCode(parseInt(x,16)));bytes=Uint8Array.from(q,c=>c.charCodeAt(0)&255);}
  let t;try{t=bytes?new TextDecoder(cs.toLowerCase()).decode(bytes):body;}catch(e){t=body;}
  if(/text\/html/i.test(ct))return {html:t.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div|tr|li)>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\n{3,}/g,'\n\n').trim()};
  if(/text\//i.test(ct))return {plain:t.trim()};return {};}
function emlLesen(raw){const {H}=emlTeil(raw);const t=emlText(raw);let d='';try{d=new Date(H.date).toISOString();}catch(e){d=new Date().toISOString();}
  return {betreff:emlDecodeWords(H.subject||''),von:emlDecodeWords(H.from||''),an:emlDecodeWords(H.to||''),datum:d,msgId:(H['message-id']||'').trim(),text:(t.plain||t.html||'').slice(0,50000)};}
async function mailSpeichern(m,mime,quelle){if(!ICH)await loadIch();const mid=OB.kz+'__'+mlHash(m.msgId||(m.datum+m.betreff+m.von));
  const name=OB.kz+'_'+String(m.datum||'').slice(0,10)+'_Mail '+m.richtung+' '+String(m.betreff||'ohne Betreff').replace(/[\/\\]/g,'-').slice(0,50).trim()+'.eml';
  let it=null;if(OB.onedrive_pfad)it=await odHochladen(OB.onedrive_pfad+'/01 Objekt/Mails',name,new Blob([mime],{type:'message/rfc822'}));
  const e={kz:OB.kz,id:mid,d:m.datum,richtung:m.richtung,von:m.von,an:m.an,betreff:m.betreff,text:String(m.text||'').slice(0,20000),datei:it?it.name:'',odId:it?it.id:'',web:it?it.web:'',msgId:m.msgId||'',quelle,by:ICH||'unbekannt',mail:ICHMAIL,erfasst:new Date().toISOString()};
  await docSet('objmails/'+mid,e);OML=OML.filter(x=>x.id!==mid).concat([e]);}
function rMails(){const box=document.getElementById('bx-mails');if(!box)return;const L=OML.slice().sort((a,b)=>String(b.d).localeCompare(String(a.d))),have=new Set(L.map(m=>m.msgId).filter(Boolean));
  document.getElementById('bs-mails').textContent=L.length+' hinterlegt'+(L.length?' · zuletzt '+dfmt(String(L[0].d).slice(0,10)):'');
  let h=`<div class="acts" style="margin-top:0"><button class="primary small" onclick="mlSuchen()"${MLS.busy?' disabled':''}>${MLS.busy==='suche'?'Suche in Outlook …':'In Outlook suchen'}</button><label class="up">.eml-Dateien hochladen<input type="file" accept=".eml,message/rfc822" multiple hidden onchange="mlUpload([...this.files]);this.value=''"></label>
    <span class="sub">Suchbegriffe: ${esc(mlBegriffe().join(', ')||'–')}</span></div><div class="sub">Mails aus Outlook auf den Desktop ziehen (ergibt eine .eml-Datei) und hier hochladen – oder direkt in Outlook nach Mails zu diesem Objekt suchen.</div>`;
  if(MLS.fehler.length)h+=`<div class="note warnbox">${MLS.fehler.map(esc).join('<br>')}</div>`;
  if(MLS.res){const neu=MLS.res.filter(m=>!have.has(m.msgId));
    h+=`<div class="rh" style="margin-top:10px">Gefunden in Outlook: ${MLS.res.length} Mails, davon ${neu.length} noch nicht hinterlegt${neu.length>1?` <button class="ghost small" onclick="mlHinterlegen(MLS.res.filter(m=>!new Set(OML.map(x=>x.msgId)).has(m.msgId)).map(m=>m.id))"${MLS.busy?' disabled':''}>alle hinterlegen</button>`:''}</div>`;
    for(const m of neu)h+=`<div class="ml-row"><b>${esc(m.betreff||'ohne Betreff')}</b> <span class="pill">${esc(m.richtung)}</span><div class="sub">${esc(new Date(m.datum).toLocaleString('de-DE'))} · von ${esc(m.von)} · an ${esc(m.an)}${m.anhang?' · mit Anhang':''}</div><div class="sub">${esc(String(m.vorschau||'').slice(0,200))}</div><button class="ghost small" onclick="mlHinterlegen(['${jq(m.id)}'])"${MLS.busy?' disabled':''}>${MLS.busy===m.id?'Hinterlege …':'Hinterlegen'}</button></div>`;}
  h+='<div class="rh" style="margin-top:12px">Hinterlegte Mails</div>';
  if(!L.length)h+='<div class="sub">Noch keine Mails hinterlegt.</div>';
  for(const m of L){const o=MLS.offen[m.id];h+=`<div class="ml-row"><a href="#" onclick="event.preventDefault();MLS.offen['${jq(m.id)}']=!MLS.offen['${jq(m.id)}'];rMails()"><b>${esc(m.betreff||'ohne Betreff')}</b></a> <span class="pill ${m.richtung==='Eingang'?'mid':''}">${esc(m.richtung)}</span><div class="sub">${esc(new Date(m.d).toLocaleString('de-DE'))} · von ${esc(m.von)} · an ${esc(m.an)} · hinterlegt von ${esc(nutzerName(m.mail||m.by))}</div>`
    +(o?`<div class="ml-b">${esc(m.text||'(kein Text)')}</div>${m.web?`<div class="acts"><a class="lnk" href="${esc(m.web)}" target="_blank" rel="noopener">Original-Mail (.eml) öffnen</a></div>`:''}`:'')+'</div>';}
  box.innerHTML=h;}
async function mlSuchen(){const b=mlBegriffe();if(!b.length){toast('Beim Objekt ist keine Straße hinterlegt.');return;}MLS.busy='suche';MLS.fehler=[];rMails();
  try{const r=await apiPost('/api/mails',{aktion:'suchen',begriffe:b},'Outlook');MLS.res=r.mails||[];MLS.fehler=r.fehler||[];if(!MLS.res.length&&!MLS.fehler.length)toast('Keine Mails zu '+b.join(', ')+' gefunden.');}
  catch(e){MLS.fehler=[e.message||String(e)];}MLS.busy='';rMails();}
async function mlHinterlegen(ids){let n=0;for(const mid of ids){const m=(MLS.res||[]).find(q=>q.id===mid);if(!m)continue;MLS.busy=mid;rMails();
    try{const r=await apiPost('/api/mails',{aktion:'laden',mailbox:m.mailbox,id:m.id},'Outlook');await mailSpeichern(Object.assign({},m,{text:r.text}),r.mime,'outlook');n++;}
    catch(e){toast((m.betreff||'Mail')+': '+(e.message||e));break;}}
  MLS.busy='';if(n){toast(n+' Mail'+(n>1?'s':'')+' hinterlegt.');rHist();}rMails();}
async function mlUpload(files){let n=0;for(const f of files){try{const raw=await f.text();const m=emlLesen(raw);const vonA=(m.von.match(/[\w.+-]+@[\w.-]+/)||[''])[0].toLowerCase();
      m.richtung=/andersmacher|wohntraum/i.test(vonA)?'Ausgang':'Eingang';if(!m.betreff)m.betreff=f.name.replace(/\.eml$/i,'');await mailSpeichern(m,raw,'upload');n++;}
    catch(e){toast(f.name+': '+(e.message||e));}}
  if(n){toast(n+' Mail'+(n>1?'s':'')+' hinterlegt.');rHist();}rMails();}

/* ---------- Kosten: Fixkosten aus dem Monatswechsel und Ist-Zahlen aus dem Objekt-Controlling ---------- */
const MON=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
let FIX=null,FIXM={},KLADE=false;
async function kostenLaden(){if(KLADE)return;KLADE=true;
  const [p,m]=await Promise.all([sb.from('os_docs').select('data').eq('app','mw').eq('pfad','stamm/plan').maybeSingle(),sb.from('os_docs').select('data').eq('app','mw').eq('pfad','monate/'+HEUTE.slice(0,7)).maybeSingle()]);
  FIX=((p.data&&p.data.data&&p.data.data.rows)||[]).filter(r=>r.obj===OB.kz);FIXM=(m.data&&m.data.data)||{};rKosten();}
function kostenOeffnen(){kostenLaden();const fr=document.getElementById('ocFrame');if(fr&&!fr.src)fr.src='/controlling-objekt-controlling.html?embed=1&obj='+encodeURIComponent(OB.kz);}
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const h=e.data&&e.data.ocHoehe;const fr=document.getElementById('ocFrame');if(h&&fr)fr.style.height=Math.max(200,Math.min(4000,h))+'px';});
function zuSeite(pfad,obj){if(obj){try{localStorage.setItem('oc_obj',obj);localStorage.setItem('oc_tab','objekt');}catch(e){}}(window.top||window).location.href=pfad;}
function rKosten(){const box=document.getElementById('bx-kosten');if(!box)return;
  if(!box.dataset.ok){box.dataset.ok='1';box.innerHTML=`<div id="kFix"></div><div class="rh" style="margin-top:14px">Ist-Zahlen aus den Kontoauszügen (Objekt-Controlling)</div><iframe id="ocFrame" title="Objekt-Controlling" style="width:100%;height:520px;border:0;display:block"></iframe>
    <div class="acts"><button class="small" onclick="zuSeite('/controlling/objekt-controlling','${jq(OB.kz)}')">Im Objekt-Controlling öffnen</button><button class="small" onclick="zuSeite('/controlling/monatswechsel-fixkosten')">Monatswechsel Fixkosten öffnen</button></div>`;
    if(SECO.kosten)kostenOeffnen();}
  const k=document.getElementById('kFix');if(!FIX){k.innerHTML='<div class="sub">Lädt …</div>';document.getElementById('bs-kosten').textContent='aufklappen zum Laden';return;}
  const m=Number(HEUTE.slice(5,7))-1,ov=FIXM.betrag||{},paid=FIXM.paid||{};
  const R=FIX.map(r=>{const pv=(r.plan||[])[m]||0;return {id:r.id,pos:r.pos,kat:r.kat,rh:r.rh||'',jahr:(r.plan||[]).reduce((a,b)=>a+(Number(b)||0),0),mon:ov[r.id]!=null?ov[r.id]:pv,faellig:!!pv,paid:paid[r.id]||'',info:r.doc&&r.doc.info};});
  for(const e of (FIXM.extra||[]))if(e.obj===OB.kz)R.push({id:e.id,pos:e.pos,kat:e.kat||'Einmalig',rh:'einmalig',jahr:Number(e.betrag)||0,mon:Number(e.betrag)||0,faellig:true,paid:paid[e.id]||''});
  const sumM=R.filter(r=>r.faellig).reduce((a,r)=>a+Number(r.mon||0),0),sumJ=R.reduce((a,r)=>a+r.jahr,0),offen=R.filter(r=>r.faellig&&!r.paid);
  document.getElementById('bs-kosten').textContent=R.length?'Fixkosten '+eur(sumJ)+' im Jahr · '+MON[m]+' '+(offen.length?offen.length+' offen':'alles bezahlt'):'keine Fixkosten geplant';
  let h=`<div class="kpis"><div class="kpi"><div class="l">Fixkosten im Jahr (Plan)</div><div class="v">${eur(sumJ)}</div></div><div class="kpi"><div class="l">Im Schnitt je Monat</div><div class="v">${eur(sumJ/12)}</div></div><div class="kpi"><div class="l">${MON[m]} fällig</div><div class="v">${eur(sumM)}</div></div><div class="kpi"><div class="l">${MON[m]} noch offen</div><div class="v">${eur(offen.reduce((a,r)=>a+Number(r.mon||0),0))}</div></div></div>`;
  h+='<div class="rh">Fixkosten laut Monatswechsel</div>';
  if(!R.length)h+='<div class="sub">Für dieses Objekt sind im Monatswechsel keine Fixkosten geplant.</div>';
  else h+=`<div style="overflow-x:auto"><table class="tab"><thead><tr><th>Position</th><th>Kategorie</th><th>Rhythmus</th><th class="r">${MON[m]}</th><th class="r">Jahr (Plan)</th><th>Status ${MON[m]}</th></tr></thead><tbody>`
    +R.sort((a,b)=>String(a.pos).localeCompare(String(b.pos),'de')).map(r=>`<tr><td><b>${esc(r.pos)}</b>${r.info?`<div class="sub">${esc(String(r.info).slice(0,140))}</div>`:''}</td><td>${esc(r.kat||'')}</td><td>${esc(r.rh)}</td><td class="r">${r.faellig?eur(r.mon):'<span class="mut">–</span>'}</td><td class="r">${eur(r.jahr)}</td><td>${!r.faellig?'<span class="pill">nicht fällig</span>':r.paid?`<span class="pill ok">bezahlt ${esc(dfmt(r.paid))}</span>`:'<span class="pill mid">offen</span>'}</td></tr>`).join('')
    +`<tr><td colspan="3"><b>Summe</b></td><td class="r"><b>${eur(sumM)}</b></td><td class="r"><b>${eur(sumJ)}</b></td><td></td></tr></tbody></table></div>`;
  k.innerHTML=h;}

/* falls die Objektdaten schon vor diesem Skript geladen waren */
if(typeof OB!=="undefined"&&OB&&OB.kz)bereicheInit();
