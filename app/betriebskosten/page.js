'use client'
import { useEffect, useState } from 'react'
// Betriebskostenabrechnung: Objekte, Kacheln je Kostenart mit Belegen, Einheiten/Schlüssel und Zählern (public/bk-abrechnung.html).
// Die bisherige Liste der Abrechnungen liegt unter /betriebskosten/liste, die Detailseite unter /betriebskosten/[id].
export default function Page(){
  const [src,setSrc]=useState('')
  useEffect(()=>{ const q=window.location.search||''; setSrc('/bk-abrechnung.html?v=20261029i'+(q?'&'+q.slice(1):'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      {src && <iframe src={src} title="Betriebskostenabrechnung" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>}
    </div>
  )
}
