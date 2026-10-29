/* Objektseite: Reiter, Zähler (Verbrauchsdaten) und Haustechnik-Guide mit QR-Freigabe */
(function(){
const st=document.createElement('style');
st.textContent=`
.tabs{display:flex;gap:4px;flex-wrap:wrap;background:var(--surf);border:1px solid var(--line);border-radius:12px;padding:5px;margin-bottom:18px}
.tabs button{background:none;border:0;border-radius:8px;padding:9px 16px;font:inherit;font-weight:600;color:var(--muted);cursor:pointer}
.tabs button.on{background:var(--accent);color:#fff}
.herobtns{position:absolute;top:16px;right:22px;z-index:3;display:flex;gap:8px}
.herobtns button{background:#0008;color:#fff;border:1px solid #ffffff33;border-radius:8px;padding:7px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.zbar{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}
.zbar label{display:flex;flex-direction:column;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);font-weight:700;gap:4px}
.inp{font:inherit;font-size:14px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surf);color:var(--text);min-width:0}
.btn{background:var(--accent);color:#fff;border:0;border-radius:9px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap}
.btn.zw{background:var(--surf2);color:var(--text);border:1px solid var(--line)}
.btn.kl{padding:5px 10px;font-size:12px;font-weight:600}
.btn.rot{background:var(--surf);color:var(--red);border:1px solid var(--line)}
.ztab{width:100%;border-collapse:collapse;font-size:13.5px}
.ztab th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);padding:7px 8px;border-bottom:1px solid var(--line)}
.ztab td{padding:9px 8px;border-bottom:1px solid var(--line);vertical-align:top}
.ztab tr.zr{cursor:pointer}.ztab tr.zr:hover td{background:var(--surf2)}
.ztab tr.inaktiv td{color:var(--muted)}
.zgr{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent2);font-weight:800;margin:18px 0 6px}
.zverl{background:var(--surf2);border-radius:10px;padding:10px 12px}
.zverl .vz{display:flex;gap:14px;padding:5px 0;border-bottom:1px solid var(--line);font-size:13px;flex-wrap:wrap}
.zverl .vz:last-child{border-bottom:0}
.lnk{color:var(--accent2);cursor:pointer;background:none;border:0;font:inherit;padding:0}
.ovl{position:fixed;inset:0;background:#0d0e1a99;z-index:50;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:30px 12px}
.mdl{background:var(--surf);border-radius:14px;padding:20px 22px;width:100%;max-width:640px}
.mdl h3{font-size:17px;margin-bottom:14px}
.mdl .fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mdl .fg label{display:flex;flex-direction:column;gap:4px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);font-weight:700}
.mdl .voll{grid-column:1/-1}
.mdl .akt{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
.mdl .hinw{font-size:12.5px;color:var(--muted);margin-top:8px}
.rg{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
@media(max-width:640px){.mdl .fg{grid-template-columns:1fr}.rg{grid-template-columns:1fr}}
.gbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
.gber{font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:800;margin:20px 0 7px}
.glist{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surf)}
.gp{border-bottom:1px solid var(--line)}.gp:last-child{border-bottom:0}
.gph{display:flex;align-items:center;gap:12px;padding:12px 15px;cursor:pointer}
.gph:hover{background:var(--surf2)}
.gph .gn{font-weight:600;margin-right:auto}
.gs{font-size:11.5px;color:var(--muted)}.gs.fehlt{color:var(--amber);font-weight:700}
.gpb{padding:4px 15px 16px}
.gpb textarea{width:100%;font:inherit;font-size:14px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;resize:vertical;min-height:64px}
.gmed{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:12px 0}
.gm{background:var(--surf2);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.gm img,.gm video{width:100%;height:130px;object-fit:cover;display:block;background:#000;cursor:pointer}
.gm input{border:0;border-top:1px solid var(--line);padding:7px 9px;font:inherit;font-size:12.5px;background:var(--surf)}
.gm .lnk{font-size:12px;color:var(--red);padding:6px 9px;text-align:left}
.gadd{display:flex;gap:8px;margin-top:8px;align-items:center}
.qrbox{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.qrbox #qr{background:#fff;padding:10px;border:1px solid var(--line);border-radius:10px}
.linkfeld{width:100%;font:inherit;font-size:12.5px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surf2)}
`;
document.head.appendChild(st);
})();

const ZTYPEN=['Stromzähler allgemein','Stromzähler WE','Stromzähler Zwischenzähler','Gaszähler','Heizölstand','Wasserzähler allgemein','Wasserzähler WE Kaltwasser','Wasserzähler WE Warmwasser','Heizungsablesung'];
const ANLAESSE=['Jahresanfang','Jahresende','Einzug','Auszug','Zwischenablesung'];
const GT=[
 {name:'Außen & Umgebung',punkte:['Fassade / Gebäudeansicht','Eingang / Zuwegung','Stellplatz / Parken / Zufahrt','Mülltonnen']},
 {name:'Haus',punkte:['Briefkasten / Klingelschild','Haustür / Klingel / Code','Treppenhaus','Keller / Abstellräume','Waschküche / Trockenraum','Hausmeister / Verwaltung']},
 {name:'Haustechnik',punkte:['Heizung / Heizungsraum','Warmwasserbereitung','Hausanschlussraum','Wasser-Haupthahn','Stromzähler / Zählerschrank','Gaszähler / Gasabsperrung','Internet / Telefon-Anschluss','Rauchmelder','Dach / Dachboden','Regenrinnen / Entwässerung']},
 {name:'Wohnung',punkte:['Wohnungstür & Zugang','Zähler in der Wohnung','Sicherungskasten / FI','Absperrventile']}
];
let Z=[],ZS=[],zGeladen=false,zInaktiv=false,zOffen={},zFiltE='',zFiltT='';
let GP=[],gGeladen=false,gOffen={};
const heute=()=>new Date().toISOString().slice(0,10);
const zahl=v=>{v=String(v==null?'':v).trim();if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');return v===''||isNaN(Number(v))?null:Number(v);};
const zfmt=n=>n==null?'—':Number(n).toLocaleString('de-DE',{maximumFractionDigits:3});
const kz=s=>String(s).replace(/[^a-z0-9]/gi,'');
function dl(idn,arr){return `<datalist id="${idn}">${arr.map(a=>`<option value="${esc(a)}">`).join('')}</datalist>`;}

/* Auswahlfelder: beim Anklicken leeren, damit alle Optionen sichtbar sind */
document.addEventListener('focusin',e=>{const t=e.target;if(t.matches&&t.matches('input[list]')){t.dataset.alt=t.value;t.value='';}});
document.addEventListener('focusout',e=>{const t=e.target;if(t.matches&&t.matches('input[list]')&&t.value===''&&t.dataset.alt){t.value=t.dataset.alt;}});

/* ---------- Reiter ---------- */
function zeigeTab(t){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  document.querySelectorAll('.pane').forEach(p=>p.hidden=p.dataset.p!==t);
  try{const u=new URL(location.href);u.searchParams.set('tab',t);history.replaceState(null,'',u);}catch(e){}
  if(t==='zaehler')zLaden();
  if(t==='guide')gLaden();
}
function osTabsInit(){
  const t=new URLSearchParams(location.search).get('tab');
  if(t&&t!=='uebersicht')zeigeTab(t);
}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>zeigeTab(b.dataset.t));});

/* ---------- Dialog ---------- */
function dialog(html){zu();const o=document.createElement('div');o.className='ovl';o.id='ovl';o.innerHTML=`<div class="mdl">${html}</div>`;o.addEventListener('mousedown',e=>{if(e.target===o)zu();});document.body.appendChild(o);return o;}
function zu(){const o=document.getElementById('ovl');if(o)o.remove();}

/* ---------- Bilder verkleinern ---------- */
function bildKlein(file,max){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;const f=Math.min(1,max/Math.max(w,h));w=Math.round(w*f);h=Math.round(h*f);const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>b?res(b):rej(new Error('Bild konnte nicht gelesen werden')),'image/jpeg',.85);URL.revokeObjectURL(img.src);};img.onerror=()=>rej(new Error('Bild konnte nicht gelesen werden'));img.src=URL.createObjectURL(file);});}
const rnd=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
async function wer(){try{const {data}=await sb.auth.getUser();const m=(data&&data.user&&data.user.email)||'';return m.split('@')[0];}catch(e){return '';}}

/* =================== ZÄHLER =================== */
function ulabel(uid){if(!uid)return 'Allgemein';const u=UNITS.find(x=>x.id===uid);return u?(u.label||u.bezeichnung||u.w_id_text||'Einheit'):'Einheit (unbekannt)';}
function uopts(){return ['Allgemein',...UNITS.map(u=>ulabel(u.id))];}
function uidVon(l){l=(l||'').trim();if(!l||l==='Allgemein')return null;const u=UNITS.find(x=>ulabel(x.id)===l);return u?u.id:undefined;}
async function zLaden(neu){
  if(zGeladen&&!neu){zRender();return;}
  const box=document.getElementById('zaehlerBox');if(!zGeladen)box.innerHTML='<div class="empty">Zähler werden geladen …</div>';
  const {data:z,error}=await sb.from('objekt_zaehler').select('*').eq('object_id',id);
  if(error){box.innerHTML='<div class="empty">Zähler konnten nicht geladen werden. Bitte im OS angemeldet sein.</div>';return;}
  Z=z||[];ZS=[];const ids=Z.map(x=>x.id);
  for(let i=0;i<ids.length;i+=100){const {data:s}=await sb.from('objekt_zaehlerstaende').select('*').in('zaehler_id',ids.slice(i,i+100)).order('datum',{ascending:false}).order('created_at',{ascending:false});ZS=ZS.concat(s||[]);}
  zGeladen=true;zRender();
}
const zStaende=zid=>ZS.filter(s=>s.zaehler_id===zid);
function zRender(){
  const box=document.getElementById('zaehlerBox');
  const typen=[...new Set(ZTYPEN.concat(Z.map(z=>z.typ)))];
  let liste=Z.filter(z=>zInaktiv||z.aktiv);
  if(zFiltE)liste=liste.filter(z=>ulabel(z.unit_id)===zFiltE);
  if(zFiltT)liste=liste.filter(z=>z.typ===zFiltT);
  const gruppen=[null,...UNITS.map(u=>u.id)];
  Z.forEach(z=>{if(!gruppen.includes(z.unit_id||null))gruppen.push(z.unit_id);});
  let html=`<div class="zbar">
    <label>Einheit<input class="inp" list="dlZE" value="${esc(zFiltE)}" placeholder="Alle Einheiten" onchange="zFiltE=this.value.trim();zRender()"></label>
    <label>Zählertyp<input class="inp" list="dlZT" value="${esc(zFiltT)}" placeholder="Alle Typen" onchange="zFiltT=this.value.trim();zRender()"></label>
    <label style="flex-direction:row;align-items:center;gap:6px;text-transform:none;font-size:13px;font-weight:600;color:var(--text)"><input type="checkbox" ${zInaktiv?'checked':''} onchange="zInaktiv=this.checked;zRender()"> ausgebaute Zähler zeigen</label>
    <span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
      ${zFiltE||zFiltT?'<button class="btn zw" onclick="zFiltE=\'\';zFiltT=\'\';zRender()">Filter zurücksetzen</button>':''}
      <button class="btn zw" onclick="zRundgang()">Ablesung für alle Zähler</button>
      <button class="btn" onclick="zFormular()">Zähler anlegen</button></span></div>
    ${dl('dlZE',uopts())}${dl('dlZT',typen)}`;
  if(!liste.length){box.innerHTML=html+'<div class="empty">Keine Zähler gefunden.</div>';return;}
  gruppen.forEach(g=>{
    const zs=liste.filter(z=>(z.unit_id||null)===g).sort((a,b)=>(ZTYPEN.indexOf(a.typ)-ZTYPEN.indexOf(b.typ))||String(a.nummer||'').localeCompare(String(b.nummer||'')));
    if(!zs.length)return;
    html+=`<div class="zgr">${esc(ulabel(g))}</div><div style="overflow-x:auto"><table class="ztab"><thead><tr><th>Zählertyp</th><th>Zählernummer</th><th>Standort</th><th>Letzter Stand</th><th>Datum</th><th>Anlass</th><th></th></tr></thead><tbody>`;
    zs.forEach(z=>{
      const s=zStaende(z.id)[0];
      html+=`<tr class="zr ${z.aktiv?'':'inaktiv'}" onclick="zOffen['${z.id}']=!zOffen['${z.id}'];zRender()">
        <td><b>${esc(z.typ)}</b>${z.aktiv?'':' (ausgebaut)'}${z.bemerkung?`<div style="font-size:12px;color:var(--muted)">${esc(z.bemerkung)}</div>`:''}</td>
        <td>${esc(z.nummer||'—')}</td><td>${esc(z.standort||'—')}</td>
        <td>${s?zfmt(s.wert):'—'}</td><td>${s?dfmt(s.datum):'—'}</td><td>${s?esc(s.anlass||''):''}</td>
        <td style="white-space:nowrap" onclick="event.stopPropagation()">${z.aktiv?`<button class="btn kl" onclick="zAblesung('${z.id}')">Ablesung</button> <button class="btn zw kl" onclick="zWechsel('${z.id}')">Wechsel</button> `:''}<button class="btn zw kl" onclick="zFormular('${z.id}')">Bearbeiten</button></td></tr>`;
      if(zOffen[z.id]){
        const v=zStaende(z.id);
        html+=`<tr><td colspan="7"><div class="zverl">${v.length?v.map(x=>`<div class="vz"><b style="min-width:90px">${dfmt(x.datum)}</b><span style="min-width:110px">${zfmt(x.wert)}</span><span style="min-width:130px">${esc(x.anlass||'')}</span>${x.notiz?`<span>${esc(x.notiz)}</span>`:''}${x.bild_pfad?`<button class="lnk" onclick="zFoto('${esc(x.bild_pfad)}')">Foto ansehen</button>`:''}<span style="margin-left:auto;color:var(--muted);font-size:11.5px">${esc(x.erfasst_von||'')}</span><button class="lnk" style="color:var(--red)" onclick="zStandLoeschen('${x.id}')">entfernen</button></div>`).join(''):'<div style="color:var(--muted);font-size:13px">Noch keine Ablesungen.</div>'}</div></td></tr>`;
      }
    });
    html+='</tbody></table></div>';
  });
  box.innerHTML=html;
}
async function zFotoHoch(zid,file){
  const blob=await bildKlein(file,1600);const pfad=`${id}/${zid}/${rnd()}.jpg`;
  const {error}=await sb.storage.from('objekt-zaehler').upload(pfad,blob,{contentType:'image/jpeg'});
  if(error)throw new Error('Foto-Upload fehlgeschlagen: '+error.message);return pfad;
}
async function zFoto(p){const {data,error}=await sb.storage.from('objekt-zaehler').createSignedUrl(p,600);if(error||!data){alert('Foto konnte nicht geöffnet werden.');return;}window.open(data.signedUrl,'_blank');}
async function zStandLoeschen(sid){if(!confirm('Diese Ablesung entfernen?'))return;const s=ZS.find(x=>x.id===sid);const {error}=await sb.from('objekt_zaehlerstaende').delete().eq('id',sid);if(error){alert('Fehler: '+error.message);return;}if(s&&s.bild_pfad)await sb.storage.from('objekt-zaehler').remove([s.bild_pfad]);ZS=ZS.filter(x=>x.id!==sid);zRender();}
function zFormular(zid){
  const z=zid?Z.find(x=>x.id===zid):{};
  dialog(`<h3>${zid?'Zähler bearbeiten':'Zähler anlegen'}</h3><div class="fg">
   <label>Einheit<input class="inp" id="fE" list="dlZE2" value="${esc(zid?ulabel(z.unit_id):'Allgemein')}"></label>
   <label>Zählertyp<input class="inp" id="fT" list="dlZT2" value="${esc(z.typ||'')}" placeholder="z. B. Gaszähler"></label>
   <label>Zählernummer<input class="inp" id="fN" value="${esc(z.nummer||'')}"></label>
   <label>Standort<input class="inp" id="fS" value="${esc(z.standort||'')}" placeholder="z. B. Keller links"></label>
   <label class="voll">Bemerkung<input class="inp" id="fB" value="${esc(z.bemerkung||'')}"></label>
   ${zid?`<label class="voll" style="flex-direction:row;align-items:center;gap:8px;text-transform:none;font-size:13.5px;color:var(--text)"><input type="checkbox" id="fA" ${z.aktiv?'checked':''}> Zähler ist eingebaut</label>`
        :`<label>Anfangsstand (optional)<input class="inp" id="fW" inputmode="decimal"></label><label>Datum<input class="inp" type="date" id="fD" value="${heute()}"></label>`}
  </div>${dl('dlZE2',uopts())}${dl('dlZT2',ZTYPEN)}
  <div class="akt">${zid?`<button class="btn rot" onclick="zLoeschen('${zid}')">Zähler löschen</button>`:''}<button class="btn zw" onclick="zu()">Abbrechen</button><button class="btn" id="fOk">Speichern</button></div>`);
  document.getElementById('fOk').onclick=async()=>{
    const uid=uidVon(document.getElementById('fE').value);if(uid===undefined){alert('Diese Einheit gibt es im Objekt nicht. Bitte aus der Liste wählen.');return;}
    const typ=document.getElementById('fT').value.trim();if(!typ){alert('Bitte den Zählertyp angeben.');return;}
    const rec={object_id:id,unit_id:uid,typ,nummer:document.getElementById('fN').value.trim()||null,standort:document.getElementById('fS').value.trim()||null,bemerkung:document.getElementById('fB').value.trim()||null,updated_at:new Date().toISOString()};
    if(zid)rec.aktiv=document.getElementById('fA').checked;
    const q=zid?sb.from('objekt_zaehler').update(rec).eq('id',zid):sb.from('objekt_zaehler').insert(rec);
    const {data,error}=await q.select().maybeSingle();if(error){alert('Fehler: '+error.message);return;}
    if(!zid){const w=zahl(document.getElementById('fW').value);if(w!=null)await sb.from('objekt_zaehlerstaende').insert({zaehler_id:data.id,datum:document.getElementById('fD').value||heute(),wert:w,anlass:'Einbau',erfasst_von:await wer()});}
    zu();zLaden(true);
  };
}
async function zLoeschen(zid){if(!confirm('Zähler mit allen Ablesungen löschen? Wenn der Zähler nur getauscht wurde, bitte stattdessen "Wechsel" verwenden.'))return;
  const pf=zStaende(zid).map(s=>s.bild_pfad).filter(Boolean);const {error}=await sb.from('objekt_zaehler').delete().eq('id',zid);if(error){alert('Fehler: '+error.message);return;}
  if(pf.length)await sb.storage.from('objekt-zaehler').remove(pf);zu();zLaden(true);}
function zAblesung(zid){
  const z=Z.find(x=>x.id===zid);const s=zStaende(zid)[0];
  dialog(`<h3>Ablesung erfassen</h3><div style="font-size:13.5px;margin-bottom:12px"><b>${esc(z.typ)}</b> · ${esc(ulabel(z.unit_id))} · Nr. ${esc(z.nummer||'—')}${s?`<br><span style="color:var(--muted)">Letzter Stand: ${zfmt(s.wert)} am ${dfmt(s.datum)}</span>`:''}</div>
  <div class="fg"><label>Datum<input class="inp" type="date" id="aD" value="${heute()}"></label>
  <label>Anlass<input class="inp" id="aA" list="dlZA3" placeholder="z. B. Jahresende"></label>
  <label>Zählerstand<input class="inp" id="aW" inputmode="decimal"></label>
  <label>Foto<input class="inp" type="file" id="aF" accept="image/*" capture="environment"></label>
  <label class="voll">Notiz<input class="inp" id="aN"></label></div>${dl('dlZA3',ANLAESSE)}
  <div class="hinw" id="aInfo"></div>
  <div class="akt"><button class="btn zw" onclick="zu()">Abbrechen</button><button class="btn" id="aOk">Speichern</button></div>`);
  document.getElementById('aOk').onclick=async function(){
    const w=zahl(document.getElementById('aW').value);const f=document.getElementById('aF').files[0];
    if(w==null&&!f){alert('Bitte Zählerstand oder Foto angeben.');return;}
    const info=document.getElementById('aInfo');info.textContent='Wird gespeichert …';this.disabled=true;
    try{const pfad=f?await zFotoHoch(zid,f):null;
      const {error}=await sb.from('objekt_zaehlerstaende').insert({zaehler_id:zid,datum:document.getElementById('aD').value||heute(),wert:w,anlass:document.getElementById('aA').value.trim()||null,notiz:document.getElementById('aN').value.trim()||null,bild_pfad:pfad,erfasst_von:await wer()});
      if(error)throw error;zu();zLaden(true);}catch(e){info.textContent='Fehler: '+e.message;this.disabled=false;}
  };
}
function zWechsel(zid){
  const z=Z.find(x=>x.id===zid);
  dialog(`<h3>Zählerwechsel</h3><div style="font-size:13.5px;margin-bottom:12px"><b>${esc(z.typ)}</b> · ${esc(ulabel(z.unit_id))}${z.standort?' · '+esc(z.standort):''}</div>
  <div class="fg"><label class="voll">Datum des Wechsels<input class="inp" type="date" id="wD" value="${heute()}"></label>
  <div class="voll zgr" style="margin:4px 0 0">Alter Zähler (Nr. ${esc(z.nummer||'—')})</div>
  <label>Endstand<input class="inp" id="wW1" inputmode="decimal"></label><label>Foto<input class="inp" type="file" id="wF1" accept="image/*" capture="environment"></label>
  <div class="voll zgr" style="margin:4px 0 0">Neuer Zähler</div>
  <label>Zählernummer<input class="inp" id="wN"></label><label>Anfangsstand<input class="inp" id="wW2" inputmode="decimal"></label>
  <label class="voll">Foto<input class="inp" type="file" id="wF2" accept="image/*" capture="environment"></label></div>
  <div class="hinw" id="wInfo">Der alte Zähler wird als ausgebaut markiert und bleibt mit allen Ablesungen erhalten.</div>
  <div class="akt"><button class="btn zw" onclick="zu()">Abbrechen</button><button class="btn" id="wOk">Wechsel speichern</button></div>`);
  document.getElementById('wOk').onclick=async function(){
    const info=document.getElementById('wInfo');const d=document.getElementById('wD').value||heute();const nr=document.getElementById('wN').value.trim();
    if(!nr){alert('Bitte die neue Zählernummer angeben.');return;}
    info.textContent='Wird gespeichert …';this.disabled=true;const w=await wer();
    try{
      const f1=document.getElementById('wF1').files[0],f2=document.getElementById('wF2').files[0];
      const p1=f1?await zFotoHoch(zid,f1):null;
      let r=await sb.from('objekt_zaehlerstaende').insert({zaehler_id:zid,datum:d,wert:zahl(document.getElementById('wW1').value),anlass:'Zählerwechsel alt',bild_pfad:p1,erfasst_von:w});if(r.error)throw r.error;
      r=await sb.from('objekt_zaehler').update({aktiv:false,updated_at:new Date().toISOString()}).eq('id',zid);if(r.error)throw r.error;
      const {data:nz,error}=await sb.from('objekt_zaehler').insert({object_id:id,unit_id:z.unit_id,typ:z.typ,nummer:nr,standort:z.standort,bemerkung:'ersetzt Zähler '+(z.nummer||'ohne Nummer')+' am '+dfmt(d)}).select().maybeSingle();if(error)throw error;
      const p2=f2?await zFotoHoch(nz.id,f2):null;
      r=await sb.from('objekt_zaehlerstaende').insert({zaehler_id:nz.id,datum:d,wert:zahl(document.getElementById('wW2').value),anlass:'Zählerwechsel neu',bild_pfad:p2,erfasst_von:w});if(r.error)throw r.error;
      zu();zLaden(true);}catch(e){info.textContent='Fehler: '+e.message;this.disabled=false;}
  };
}
function zRundgang(){
  dialog(`<h3>Ablesung für alle Zähler</h3><div class="fg"><label>Datum<input class="inp" type="date" id="rD" value="${heute()}"></label>
  <label>Anlass<input class="inp" id="rA" list="dlZA4" value="Jahresende"></label>
  <label class="voll">Einheit<input class="inp" id="rE" list="dlZE4" placeholder="Alle Einheiten" onchange="zRundListe()"></label></div>${dl('dlZA4',ANLAESSE)}${dl('dlZE4',uopts())}
  <div id="rListe" style="margin-top:12px"></div><div class="hinw" id="rInfo">Nur ausgefüllte Zeilen werden gespeichert.</div>
  <div class="akt"><button class="btn zw" onclick="zu()">Abbrechen</button><button class="btn" id="rOk">Alle speichern</button></div>`);
  zRundListe();
  document.getElementById('rOk').onclick=async function(){
    const info=document.getElementById('rInfo');const d=document.getElementById('rD').value||heute(),an=document.getElementById('rA').value.trim()||null;const w=await wer();
    const zeilen=[...document.querySelectorAll('#rListe .rg[data-z]')];let n=0;this.disabled=true;
    try{for(const zl of zeilen){const zid=zl.dataset.z;const wert=zahl(zl.querySelector('.rW').value);const f=zl.querySelector('.rF').files[0];if(wert==null&&!f)continue;
        info.textContent='Speichere '+(++n)+' …';const p=f?await zFotoHoch(zid,f):null;
        const {error}=await sb.from('objekt_zaehlerstaende').insert({zaehler_id:zid,datum:d,wert,anlass:an,bild_pfad:p,erfasst_von:w});if(error)throw error;}
      if(!n){info.textContent='Es wurde nichts eingetragen.';this.disabled=false;return;}
      zu();zLaden(true);}catch(e){info.textContent='Fehler: '+e.message;this.disabled=false;}
  };
}
function zRundListe(){
  const e=((document.getElementById('rE')||{}).value||'').trim();
  const liste=Z.filter(z=>z.aktiv&&(!e||ulabel(z.unit_id)===e)).sort((a,b)=>ulabel(a.unit_id).localeCompare(ulabel(b.unit_id),'de')||(ZTYPEN.indexOf(a.typ)-ZTYPEN.indexOf(b.typ)));
  document.getElementById('rListe').innerHTML=liste.length?liste.map(z=>{const s=zStaende(z.id)[0];return `<div class="rg" data-z="${z.id}"><div><b>${esc(z.typ)}</b><div style="font-size:12px;color:var(--muted)">${esc(ulabel(z.unit_id))} · Nr. ${esc(z.nummer||'—')}${z.standort?' · '+esc(z.standort):''}${s?'<br>zuletzt '+zfmt(s.wert)+' am '+dfmt(s.datum):''}</div></div><input class="inp rW" inputmode="decimal" placeholder="Zählerstand"><input class="inp rF" type="file" accept="image/*" capture="environment"></div>`;}).join(''):'<div class="empty">Keine eingebauten Zähler.</div>';
}

/* =================== GUIDE =================== */
async function gLaden(neu){
  if(gGeladen&&!neu){gRender();return;}
  const {data,error}=await sb.from('objekt_guide_punkte').select('*').eq('object_id',id);
  if(error){document.getElementById('guideBox').innerHTML='<div class="empty">Guide konnte nicht geladen werden. Bitte im OS angemeldet sein.</div>';return;}
  GP=data||[];gGeladen=true;gRender();
}
function gBereiche(){const b=GT.map(x=>x.name);GP.slice().sort((a,c)=>(a.sort||0)-(c.sort||0)).forEach(r=>{if(!b.includes(r.bereich))b.push(r.bereich);});return b;}
function gPunkte(ber){
  const bi=gBereiche().indexOf(ber);const t=(GT.find(x=>x.name===ber)||{punkte:[]}).punkte;
  const out=t.map((p,pi)=>({bereich:ber,punkt:p,sort:bi*100+pi,text:'',medien:[],vorlage:true}));
  GP.filter(r=>r.bereich===ber).forEach(r=>{const o=out.find(x=>x.punkt===r.punkt);if(o)Object.assign(o,r,{vorlage:true});else out.push(Object.assign({},r));});
  return out.sort((a,b)=>(a.sort||0)-(b.sort||0));
}
const gKey=(b,p)=>b+'|'+p;
function gStatus(p){const n=(p.medien||[]).length;const v=(p.medien||[]).filter(m=>m.typ==='video').length;
  if(!n&&!(p.text||'').trim())return '<span class="gs fehlt">fehlt</span>';
  const t=[];if(n-v)t.push((n-v)+(n-v===1?' Foto':' Fotos'));if(v)t.push(v+(v===1?' Video':' Videos'));if(!t.length)t.push('nur Text');return `<span class="gs">${t.join(', ')}</span>`;}
function gUmschalten(kk){const k=decodeURIComponent(kk);gOffen[k]=!gOffen[k];gRender();}
function gRender(){
  const box=document.getElementById('guideBox');
  const alle=gBereiche().flatMap(gPunkte);const gefuellt=alle.filter(p=>(p.medien||[]).length||(p.text||'').trim()).length;
  let html=`<div class="gbar"><div style="margin-right:auto;font-size:13.5px;color:var(--muted)">Haustechnik-Guide für Dienstleister und Handwerker. ${gefuellt} von ${alle.length} Punkten ausgefüllt.</div>
   <button class="btn zw" onclick="window.open('/guide.html?objekt=${encodeURIComponent(id)}','_blank')">Vorschau</button>
   <button class="btn" onclick="guideTeilen()">QR / Link teilen</button></div>`;
  gBereiche().forEach((ber,bi)=>{
    html+=`<div class="gber">${esc(ber)}</div><div class="glist">`;
    gPunkte(ber).forEach(p=>{
      const k=gKey(ber,p.punkt),kk=encodeURIComponent(k),offen=gOffen[k];
      html+=`<div class="gp"><div class="gph" onclick="gUmschalten('${kk}')"><span class="gn">${esc(p.punkt)}</span>${gStatus(p)}<span class="gs">${offen?'zuklappen':'öffnen'}</span></div>`;
      if(offen){
        html+=`<div class="gpb"><textarea placeholder="Beschreibung: Wo genau? Wie kommt man hin? Was ist zu beachten?" onchange="gText('${kk}',this.value)">${esc(p.text||'')}</textarea>
          <div class="gmed">${(p.medien||[]).map((m,i)=>`<div class="gm">${m.typ==='video'?`<video src="${esc(m.url)}" controls preload="metadata" playsinline></video>`:`<img src="${esc(m.url)}" loading="lazy" onclick="window.open(this.src,'_blank')">`}<input value="${esc(m.text||'')}" placeholder="Bildunterschrift" onchange="gMedText('${kk}',${i},this.value)"><button class="lnk" onclick="gMedWeg('${kk}',${i})">entfernen</button></div>`).join('')}</div>
          <div class="gadd"><label class="btn zw kl" style="cursor:pointer">Fotos / Videos hinzufügen<input type="file" accept="image/*,video/*" multiple hidden onchange="gHoch('${kk}',this)"></label>
          ${p.vorlage?'':`<button class="btn rot kl" onclick="gPunktWeg('${kk}')">Punkt entfernen</button>`}<span class="gs" id="gi_${kz(kk)}"></span></div></div>`;
      }
      html+='</div>';
    });
    html+=`<div class="gp"><div class="gadd" style="padding:10px 15px;margin:0"><input class="inp" style="flex:1" placeholder="Weiteren Punkt in ${esc(ber)} hinzufügen" id="neu_${bi}"><button class="btn zw kl" onclick="gNeu(${bi})">Hinzufügen</button></div></div></div>`;
  });
  html+=`<div class="gadd" style="margin-top:18px;flex-wrap:wrap"><input class="inp" id="neuBer" placeholder="Neuen Bereich anlegen, z. B. Garten" style="flex:1;max-width:360px"><input class="inp" id="neuBerP" placeholder="Erster Punkt" style="flex:1;max-width:300px"><button class="btn zw kl" onclick="gNeuBereich()">Bereich anlegen</button></div>`;
  box.innerHTML=html;
}
function gFinde(kk){const k=decodeURIComponent(kk);const i=k.indexOf('|');const ber=k.slice(0,i),pu=k.slice(i+1);return gPunkte(ber).find(p=>p.punkt===pu);}
async function gSpeichern(p){
  const rec={object_id:id,bereich:p.bereich,punkt:p.punkt,text:p.text||null,sort:p.sort||0,medien:p.medien||[],updated_at:new Date().toISOString()};
  const {data,error}=await sb.from('objekt_guide_punkte').upsert(rec,{onConflict:'object_id,bereich,punkt'}).select().maybeSingle();
  if(error){alert('Speichern fehlgeschlagen: '+error.message);return false;}
  GP=GP.filter(r=>!(r.bereich===p.bereich&&r.punkt===p.punkt));GP.push(data);return true;
}
async function gText(kk,v){const p=gFinde(kk);p.text=v.trim();await gSpeichern(p);gRender();}
async function gMedText(kk,i,v){const p=gFinde(kk);p.medien=[...p.medien];p.medien[i]=Object.assign({},p.medien[i],{text:v.trim()});await gSpeichern(p);}
async function gMedWeg(kk,i){if(!confirm('Foto/Video entfernen?'))return;const p=gFinde(kk);const m=p.medien[i];p.medien=p.medien.filter((x,j)=>j!==i);if(await gSpeichern(p)&&m.pfad)await sb.storage.from('objekt-guide').remove([m.pfad]);gRender();}
async function gHoch(kk,inp){
  const p=gFinde(kk);const files=[...inp.files];if(!files.length)return;
  const info=document.getElementById('gi_'+kz(kk));p.medien=[...(p.medien||[])];
  for(let i=0;i<files.length;i++){const f=files[i];if(info)info.textContent='Lade '+(i+1)+' von '+files.length+' hoch …';
    try{const vid=(f.type||'').startsWith('video/');
      if(vid&&f.size>50*1024*1024){alert(f.name+' ist größer als 50 MB. Bitte ein kürzeres Video verwenden.');continue;}
      const blob=vid?f:await bildKlein(f,1600);const ext=vid?((f.name.split('.').pop()||'mp4').toLowerCase()):'jpg';
      const pfad=`${id}/${rnd()}.${ext}`;
      const {error}=await sb.storage.from('objekt-guide').upload(pfad,blob,{contentType:vid?(f.type||'video/mp4'):'image/jpeg'});if(error)throw error;
      const url=sb.storage.from('objekt-guide').getPublicUrl(pfad).data.publicUrl;
      p.medien.push({url,pfad,typ:vid?'video':'bild',text:''});
    }catch(e){alert('Upload fehlgeschlagen: '+(e.message||e));}}
  await gSpeichern(p);gRender();
}
async function gNeu(bi){const ber=gBereiche()[bi];const el=document.getElementById('neu_'+bi);const name=(el.value||'').trim();if(!name)return;
  if(gPunkte(ber).some(p=>p.punkt.toLowerCase()===name.toLowerCase())){alert('Diesen Punkt gibt es schon.');return;}
  const s=bi*100+50+gPunkte(ber).length;if(await gSpeichern({bereich:ber,punkt:name,sort:s,text:'',medien:[]})){gOffen[gKey(ber,name)]=true;gRender();}}
async function gNeuBereich(){const b=document.getElementById('neuBer').value.trim(),p=document.getElementById('neuBerP').value.trim();if(!b||!p){alert('Bitte Bereich und ersten Punkt angeben.');return;}
  if(await gSpeichern({bereich:b,punkt:p,sort:gBereiche().length*100,text:'',medien:[]})){gOffen[gKey(b,p)]=true;gRender();}}
async function gPunktWeg(kk){const p=gFinde(kk);if(!confirm('Punkt "'+p.punkt+'" mit allen Fotos entfernen?'))return;
  const {error}=await sb.from('objekt_guide_punkte').delete().eq('object_id',id).eq('bereich',p.bereich).eq('punkt',p.punkt);if(error){alert(error.message);return;}
  const pf=(p.medien||[]).map(m=>m.pfad).filter(Boolean);if(pf.length)await sb.storage.from('objekt-guide').remove(pf);
  GP=GP.filter(r=>!(r.bereich===p.bereich&&r.punkt===p.punkt));gRender();}

/* ---------- Freigabe per QR / Link ---------- */
function qrLib(){return new Promise((res,rej)=>{if(window.QRCode)return res();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=()=>res();s.onerror=()=>rej(new Error('QR-Code konnte nicht erzeugt werden.'));document.head.appendChild(s);});}
async function guideTeilen(){
  dialog('<h3>Guide teilen</h3><div class="empty">Lädt …</div>');
  const {data,error}=await sb.from('objekt_guide_freigaben').select('*').eq('object_id',id).is('einheit_id',null).eq('aktiv',true).order('created_at',{ascending:false}).limit(1);
  if(error){dialog('<h3>Guide teilen</h3><div class="empty">Fehler: '+esc(error.message)+'</div><div class="akt"><button class="btn zw" onclick="zu()">Schließen</button></div>');return;}
  const f=(data||[])[0];
  if(!f){dialog(`<h3>Guide teilen</h3><p style="font-size:14px;line-height:1.6">Mit dem Link oder QR-Code sehen Dienstleister und Handwerker <b>nur den Haustechnik-Guide</b> dieses Objekts, keine Mieter, Verträge oder Finanzen. Eine Anmeldung ist nicht nötig. Der Link kann jederzeit gesperrt werden.</p>
    <div class="akt"><button class="btn zw" onclick="zu()">Abbrechen</button><button class="btn" onclick="gFreigabeNeu()">Link erzeugen</button></div>`);return;}
  const url=location.origin+'/guide.html?t='+f.token;
  dialog(`<h3>Guide teilen</h3><div class="qrbox"><div id="qr"></div><div style="flex:1;min-width:220px">
    <p style="font-size:13.5px;line-height:1.6;margin-bottom:10px">Dieser Link zeigt nur den Haustechnik-Guide von <b>${esc(OB.name||'')}</b>. Erstellt am ${dfmt(f.created_at)}${f.erstellt_von?' von '+esc(f.erstellt_von):''}.</p>
    <input class="linkfeld" readonly value="${esc(url)}" onclick="this.select()">
    <div class="gadd" style="flex-wrap:wrap"><button class="btn kl" onclick="navigator.clipboard.writeText('${esc(url)}').then(()=>this.textContent='Kopiert')">Link kopieren</button><button class="btn zw kl" onclick="gQrDruck('${esc(url)}')">QR-Code drucken</button><button class="btn zw kl" onclick="window.open('${esc(url)}','_blank')">Öffnen</button></div></div></div>
    <div class="akt"><button class="btn rot" onclick="gSperren('${f.id}')">Link sperren</button><button class="btn zw" onclick="gFreigabeNeu('${f.id}')">Neuen Link erzeugen</button><button class="btn" onclick="zu()">Fertig</button></div>`);
  try{await qrLib();new QRCode(document.getElementById('qr'),{text:url,width:170,height:170,correctLevel:QRCode.CorrectLevel.M});}catch(e){document.getElementById('qr').textContent=e.message;}
}
async function gFreigabeNeu(alt){
  if(alt){if(!confirm('Der bisherige Link und QR-Code funktionieren danach nicht mehr. Fortfahren?'))return;await sb.from('objekt_guide_freigaben').update({aktiv:false}).eq('id',alt);}
  const {error}=await sb.from('objekt_guide_freigaben').insert({object_id:id,erstellt_von:await wer()});if(error){alert('Fehler: '+error.message);return;}guideTeilen();}
async function gSperren(fid){if(!confirm('Link sperren? Wer den QR-Code hat, sieht den Guide danach nicht mehr.'))return;await sb.from('objekt_guide_freigaben').update({aktiv:false}).eq('id',fid);guideTeilen();}
function gQrDruck(url){
  const c=document.querySelector('#qr canvas'),im=document.querySelector('#qr img');const src=c?c.toDataURL('image/png'):(im?im.src:'');
  const w=window.open('','_blank');if(!w)return;
  w.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Guide ${esc(OB.name||'')}</title><style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#1c2230}h1{font-size:26px;margin:0 0 6px}p{color:#555;margin:4px 0}img{width:260px;height:260px;margin:26px 0;image-rendering:pixelated}</style></head><body>
   <h1>${esc(OB.name||'')}</h1><p>${esc(OB.display_address||'')}</p><img src="${src}"><p><b>Haustechnik-Guide für Dienstleister und Handwerker</b></p><p>QR-Code scannen: Lage von Zählern, Heizung, Absperrungen und Zugängen.</p><p style="font-size:11px;margin-top:20px">Wohntraum Rheinhessen</p>
   <script>setTimeout(()=>window.print(),300)<\/script></body></html>`);w.document.close();
}
