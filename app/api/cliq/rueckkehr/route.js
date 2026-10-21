// Rückkehr von der Zoho-Anmeldung: Diese Seite schickt den Code mit der OS-Anmeldung des Nutzers an /api/cliq.
export const dynamic = 'force-dynamic'
export async function GET(req) {
  const u = new URL(req.url)
  const d = JSON.stringify({ code: u.searchParams.get('code') || '', state: u.searchParams.get('state') || '', server: u.searchParams.get('accounts-server') || '', fehler: u.searchParams.get('error') || '' }).replace(/</g, '\\u003c')
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cliq verbinden</title>
<style>body{font:15px/1.5 system-ui,sans-serif;background:#f3f5f8;color:#18202c;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.k{background:#fff;border:1px solid #e0e5eb;border-radius:12px;padding:24px 28px;max-width:420px;text-align:center}a{color:#2f5d8a}</style></head>
<body><div class="k"><h2 style="margin-top:0">Cliq verbinden</h2><p id="t">Einen Moment, die Verbindung wird gespeichert …</p></div>
<script>(async()=>{const d=${d};const t=document.getElementById('t');
if(d.fehler||!d.code){t.textContent='Die Anmeldung bei Zoho wurde abgebrochen'+(d.fehler?' ('+d.fehler+')':'')+'. Du kannst dieses Fenster schließen.';return;}
let tok='';try{for(const k of Object.keys(localStorage)){if(/^sb-.*-auth-token$/.test(k)){const s=JSON.parse(localStorage.getItem(k));tok=(s&&(s.access_token||(s.currentSession&&s.currentSession.access_token)))||'';}}}catch(e){}
if(!tok){t.textContent='Bitte zuerst im Wohntraum OS anmelden und dann noch einmal verbinden.';return;}
try{const r=await fetch('/api/cliq',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:JSON.stringify({aktion:'code',code:d.code,state:d.state,server:d.server})});const j=await r.json();
if(j.error)throw new Error(j.error);t.innerHTML='Cliq ist verbunden'+(j.name?' als <b>'+j.name.replace(/</g,'&lt;')+'</b>':'')+'. Dieses Fenster schließt sich gleich.';
try{if(window.opener){window.opener.postMessage({cliqVerbunden:true},location.origin);setTimeout(()=>window.close(),1500);}else setTimeout(()=>location.href='/verwalto/cliq',1500);}catch(e){}}
catch(e){t.textContent='Verbinden fehlgeschlagen: '+(e.message||e);}})();</script></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
