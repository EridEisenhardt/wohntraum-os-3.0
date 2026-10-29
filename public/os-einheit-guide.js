/* Haustechnik-Guide je Einheit (Objektseite, Einheiten & Mieter).
   Punkte: einheit_guide_punkte (einheit_id, bereich, punkt, text, medien). Freigabe-Link: objekt_guide_freigaben mit einheit_id.
   Der geteilte Link zeigt den Guide der Einheit und darunter den Guide des Hauses. */
const GTE=[
 {name:'Zugang',punkte:['Wohnungstür / Schlüssel','Klingel / Briefkasten','Kellerabteil / Stellplatz']},
 {name:'Strom',punkte:['Stromzähler','Sicherungskasten / FI']},
 {name:'Wasser',punkte:['Wasserzähler','Absperrventile','Warmwasser (Boiler / Durchlauferhitzer)']},
 {name:'Heizung',punkte:['Heizkörper / Thermostate','Therme / Gastherme','Heizkostenverteiler']},
 {name:'Küche & Bad',punkte:['Einbauküche / Geräte','Bad / WC / Dusche','Waschmaschinenanschluss']},
 {name:'Sonstiges',punkte:['Rauchmelder','Internet / TV-Anschluss','Fenster / Rollläden']}
];
let EG={uid:'',P:[],offen:{}};
const egEin=()=>(typeof EIN!=='undefined'?EIN:[]).find(x=>x.id===EG.uid)||{};
function egBereiche(){const b=GTE.map(x=>x.name);EG.P.slice().sort((a,c)=>(a.sort||0)-(c.sort||0)).forEach(r=>{if(!b.includes(r.bereich))b.push(r.bereich);});return b;}
function egPunkte(ber){const bi=egBereiche().indexOf(ber);const t=(GTE.find(x=>x.name===ber)||{punkte:[]}).punkte;
  const out=t.map((p,pi)=>({bereich:ber,punkt:p,sort:bi*100+pi,text:'',medien:[],vorlage:true}));
  EG.P.filter(r=>r.bereich===ber).forEach(r=>{const o=out.find(x=>x.punkt===r.punkt);if(o)Object.assign(o,r,{vorlage:true});else out.push(Object.assign({},r));});
  return out.sort((a,b)=>(a.sort||0)-(b.sort||0));}
const egKey=(b,p)=>encodeURIComponent(b+'|'+p);
function egFinde(kk){const k=decodeURIComponent(kk);const i=k.indexOf('|');return egPunkte(k.slice(0,i)).find(p=>p.punkt===k.slice(i+1));}
async function egOeffnen(uid){EG={uid,P:[],offen:{}};dialog('<h3>Guide '+esc(egEin().bezeichnung||'')+'</h3><div class="empty">Lädt …</div>');egBreit();
  const {data,error}=await sb.from('einheit_guide_punkte').select('*').eq('einheit_id',uid);
  if(error){dialog('<h3>Guide</h3><div class="empty">Guide konnte nicht geladen werden: '+esc(error.message)+'</div><div class="akt"><button class="btn zw" onclick="zu()">Schließen</button></div>');return;}
  EG.P=data||[];egRender();}
function egBreit(){const m=document.querySelector('#ovl .mdl');if(m){m.style.maxWidth='980px';m.style.maxHeight='92vh';m.style.overflow='auto';}}
function egStatus(p){const n=(p.medien||[]).length,v=(p.medien||[]).filter(m=>m.typ==='video').length;if(!n&&!(p.text||'').trim())return '<span class="gs fehlt">fehlt</span>';
  const t=[];if(n-v)t.push((n-v)+(n-v===1?' Foto':' Fotos'));if(v)t.push(v+(v===1?' Video':' Videos'));if(!t.length)t.push('nur Text');return '<span class="gs">'+t.join(', ')+'</span>';}
function egRender(){const u=egEin(),alle=egBereiche().flatMap(egPunkte),gef=alle.filter(p=>(p.medien||[]).length||(p.text||'').trim()).length;
  const sc=(document.querySelector('#ovl .mdl')||{}).scrollTop||0;
  let h='<h3>Guide '+esc(u.bezeichnung||'')+(u.lage?' <span class="sub" style="font-weight:400">'+esc(u.lage)+'</span>':'')+'</h3>'
   +'<div class="gbar"><div style="margin-right:auto;font-size:13.5px;color:var(--muted)">Haustechnik-Guide für diese Einheit. '+gef+' von '+alle.length+' Punkten ausgefüllt. Der geteilte Link zeigt auch den Guide des Hauses.</div>'
   +'<button class="btn zw" onclick="window.open(\'/guide.html?objekt='+encodeURIComponent(id)+'&einheit='+encodeURIComponent(EG.uid)+'\',\'_blank\')">Vorschau</button><button class="btn" onclick="egTeilen()">QR / Link teilen</button></div>';
  egBereiche().forEach((ber,bi)=>{h+='<div class="gber">'+esc(ber)+'</div><div class="glist">';
    egPunkte(ber).forEach(p=>{const kk=egKey(ber,p.punkt),of=EG.offen[kk];
      h+='<div class="gp"><div class="gph" onclick="EG.offen[\''+kk+'\']=!EG.offen[\''+kk+'\'];egRender()"><span class="gn">'+esc(p.punkt)+'</span>'+egStatus(p)+'<span class="gs">'+(of?'zuklappen':'öffnen')+'</span></div>';
      if(of){h+='<div class="gpb"><textarea placeholder="Beschreibung: Wo genau? Wie kommt man hin? Was ist zu beachten?" onchange="egText(\''+kk+'\',this.value)">'+esc(p.text||'')+'</textarea>'
        +'<div class="gmed">'+(p.medien||[]).map((m,i)=>'<div class="gm">'+(m.typ==='video'?'<video src="'+esc(m.url)+'" controls preload="metadata" playsinline></video>':'<img src="'+esc(m.url)+'" loading="lazy" onclick="window.open(this.src,\'_blank\')">')+'<input value="'+esc(m.text||'')+'" placeholder="Bildunterschrift" onchange="egMedText(\''+kk+'\','+i+',this.value)"><button class="lnk" onclick="egMedWeg(\''+kk+'\','+i+')">entfernen</button></div>').join('')+'</div>'
        +'<div class="gadd"><label class="btn zw kl" style="cursor:pointer">Fotos / Videos hinzufügen<input type="file" accept="image/*,video/*" multiple hidden onchange="egHoch(\''+kk+'\',this)"></label>'+(p.vorlage?'':'<button class="btn rot kl" onclick="egPunktWeg(\''+kk+'\')">Punkt entfernen</button>')+'<span class="gs" id="egi_'+kz(kk)+'"></span></div></div>';}
      h+='</div>';});
    h+='<div class="gp"><div class="gadd" style="padding:10px 15px;margin:0"><input class="inp" style="flex:1" placeholder="Weiteren Punkt in '+esc(ber)+' hinzufügen" id="egneu_'+bi+'"><button class="btn zw kl" onclick="egNeu('+bi+')">Hinzufügen</button></div></div></div>';});
  h+='<div class="gadd" style="margin-top:18px;flex-wrap:wrap"><input class="inp" id="egNeuBer" placeholder="Neuen Bereich anlegen, z. B. Balkon" style="flex:1;max-width:320px"><input class="inp" id="egNeuBerP" placeholder="Erster Punkt" style="flex:1;max-width:280px"><button class="btn zw kl" onclick="egNeuBereich()">Bereich anlegen</button></div>'
   +'<div class="akt"><button class="btn" onclick="zu()">Fertig</button></div>';
  const m=document.querySelector('#ovl .mdl');if(m){m.innerHTML=h;m.scrollTop=sc;}else{dialog(h);egBreit();}}
async function egSpeichern(p){const rec={object_id:String(id),einheit_id:EG.uid,bereich:p.bereich,punkt:p.punkt,text:p.text||null,sort:p.sort||0,medien:p.medien||[],updated_at:new Date().toISOString()};
  const {data,error}=await sb.from('einheit_guide_punkte').upsert(rec,{onConflict:'einheit_id,bereich,punkt'}).select().maybeSingle();
  if(error){alert('Speichern fehlgeschlagen: '+error.message);return false;}
  EG.P=EG.P.filter(r=>!(r.bereich===p.bereich&&r.punkt===p.punkt));EG.P.push(data);return true;}
async function egText(kk,v){const p=egFinde(kk);p.text=v.trim();await egSpeichern(p);egRender();}
async function egMedText(kk,i,v){const p=egFinde(kk);p.medien=[...p.medien];p.medien[i]=Object.assign({},p.medien[i],{text:v.trim()});await egSpeichern(p);}
async function egMedWeg(kk,i){if(!confirm('Foto/Video entfernen?'))return;const p=egFinde(kk);const m=p.medien[i];p.medien=p.medien.filter((x,j)=>j!==i);if(await egSpeichern(p)&&m.pfad)await sb.storage.from('objekt-guide').remove([m.pfad]);egRender();}
async function egHoch(kk,inp){const p=egFinde(kk);const files=[...inp.files];if(!files.length)return;const info=document.getElementById('egi_'+kz(kk));p.medien=[...(p.medien||[])];
  for(let i=0;i<files.length;i++){const f=files[i];if(info)info.textContent='Lade '+(i+1)+' von '+files.length+' hoch …';
    try{const vid=(f.type||'').startsWith('video/');if(vid&&f.size>50*1024*1024){alert(f.name+' ist größer als 50 MB. Bitte ein kürzeres Video verwenden.');continue;}
      const blob=vid?f:await bildKlein(f,1600);const ext=vid?((f.name.split('.').pop()||'mp4').toLowerCase()):'jpg';const pfad=id+'/einheit-'+EG.uid+'/'+rnd()+'.'+ext;
      const {error}=await sb.storage.from('objekt-guide').upload(pfad,blob,{contentType:vid?(f.type||'video/mp4'):'image/jpeg'});if(error)throw error;
      p.medien.push({url:sb.storage.from('objekt-guide').getPublicUrl(pfad).data.publicUrl,pfad,typ:vid?'video':'bild',text:''});
    }catch(e){alert('Upload fehlgeschlagen: '+(e.message||e));}}
  await egSpeichern(p);egRender();}
async function egNeu(bi){const ber=egBereiche()[bi];const el=document.getElementById('egneu_'+bi);const name=(el.value||'').trim();if(!name)return;
  if(egPunkte(ber).some(p=>p.punkt.toLowerCase()===name.toLowerCase())){alert('Diesen Punkt gibt es schon.');return;}
  if(await egSpeichern({bereich:ber,punkt:name,sort:bi*100+50+egPunkte(ber).length,text:'',medien:[]})){EG.offen[egKey(ber,name)]=true;egRender();}}
async function egNeuBereich(){const b=document.getElementById('egNeuBer').value.trim(),p=document.getElementById('egNeuBerP').value.trim();if(!b||!p){alert('Bitte Bereich und ersten Punkt angeben.');return;}
  if(await egSpeichern({bereich:b,punkt:p,sort:egBereiche().length*100,text:'',medien:[]})){EG.offen[egKey(b,p)]=true;egRender();}}
async function egPunktWeg(kk){const p=egFinde(kk);if(!confirm('Punkt "'+p.punkt+'" mit allen Fotos entfernen?'))return;
  const {error}=await sb.from('einheit_guide_punkte').delete().eq('einheit_id',EG.uid).eq('bereich',p.bereich).eq('punkt',p.punkt);if(error){alert(error.message);return;}
  const pf=(p.medien||[]).map(m=>m.pfad).filter(Boolean);if(pf.length)await sb.storage.from('objekt-guide').remove(pf);EG.P=EG.P.filter(r=>!(r.bereich===p.bereich&&r.punkt===p.punkt));egRender();}
/* Link und QR-Code für die Einheit */
async function egTeilen(){const u=egEin();
  const zurueck='<button class="btn zw" onclick="egRender()">Zurück zum Guide</button>';
  const m=document.querySelector('#ovl .mdl');const setz=h=>{if(m)m.innerHTML=h;else dialog(h);};
  setz('<h3>Guide '+esc(u.bezeichnung||'')+' teilen</h3><div class="empty">Lädt …</div>');
  const {data,error}=await sb.from('objekt_guide_freigaben').select('*').eq('object_id',String(id)).eq('einheit_id',EG.uid).eq('aktiv',true).order('created_at',{ascending:false}).limit(1);
  if(error){setz('<h3>Guide teilen</h3><div class="empty">Fehler: '+esc(error.message)+'</div><div class="akt">'+zurueck+'</div>');return;}
  const f=(data||[])[0];
  if(!f){setz('<h3>Guide '+esc(u.bezeichnung||'')+' teilen</h3><p style="font-size:14px;line-height:1.6">Mit dem Link oder QR-Code sehen Dienstleister und Handwerker <b>nur den Haustechnik-Guide dieser Einheit und des Hauses</b>, keine Mieter, Verträge oder Finanzen. Eine Anmeldung ist nicht nötig. Der Link kann jederzeit gesperrt werden.</p><div class="akt">'+zurueck+'<button class="btn" onclick="egFreigabeNeu()">Link erzeugen</button></div>');return;}
  const url=location.origin+'/guide.html?t='+f.token;
  setz('<h3>Guide '+esc(u.bezeichnung||'')+' teilen</h3><div class="qrbox"><div id="qr"></div><div style="flex:1;min-width:220px"><p style="font-size:13.5px;line-height:1.6;margin-bottom:10px">Dieser Link zeigt den Guide von <b>'+esc(u.bezeichnung||'')+'</b> und den Guide des Hauses <b>'+esc(OB.name||'')+'</b>. Erstellt am '+dfmt(f.created_at)+(f.erstellt_von?' von '+esc(f.erstellt_von):'')+'.</p>'
    +'<input class="linkfeld" readonly value="'+esc(url)+'" onclick="this.select()"><div class="gadd" style="flex-wrap:wrap"><button class="btn kl" onclick="navigator.clipboard.writeText(\''+esc(url)+'\').then(()=>this.textContent=\'Kopiert\')">Link kopieren</button><button class="btn zw kl" onclick="gQrDruck(\''+esc(url)+'\')">QR-Code drucken</button><button class="btn zw kl" onclick="window.open(\''+esc(url)+'\',\'_blank\')">Öffnen</button></div></div></div>'
    +'<div class="akt"><button class="btn rot" onclick="egSperren(\''+f.id+'\')">Link sperren</button><button class="btn zw" onclick="egFreigabeNeu(\''+f.id+'\')">Neuen Link erzeugen</button>'+zurueck+'</div>');
  try{await qrLib();new QRCode(document.getElementById('qr'),{text:url,width:170,height:170,correctLevel:QRCode.CorrectLevel.M});}catch(e){document.getElementById('qr').textContent=e.message;}}
async function egFreigabeNeu(alt){if(alt){if(!confirm('Der bisherige Link und QR-Code funktionieren danach nicht mehr. Fortfahren?'))return;await sb.from('objekt_guide_freigaben').update({aktiv:false}).eq('id',alt);}
  const {error}=await sb.from('objekt_guide_freigaben').insert({object_id:String(id),einheit_id:EG.uid,erstellt_von:await wer()});if(error){alert('Fehler: '+error.message);return;}egTeilen();}
async function egSperren(fid){if(!confirm('Link sperren? Wer den QR-Code hat, sieht den Guide danach nicht mehr.'))return;await sb.from('objekt_guide_freigaben').update({aktiv:false}).eq('id',fid);egTeilen();}
