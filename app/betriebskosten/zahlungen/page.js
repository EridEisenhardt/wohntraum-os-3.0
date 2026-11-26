'use client'
import { useEffect, useState } from 'react'
/* Übersicht der Betriebskostenabrechnungen je Mieter: offen, fällig, mahnbar, bezahlt, Guthaben ausgezahlt (Mieterkonten mit ?bka=1) */
export default function Page(){
  const [src,setSrc]=useState('')
  useEffect(()=>{ setSrc('/hv-mieterkonten.html?v=20261126a&bka=1') },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      {src && <iframe src={src} title="Betriebskosten Zahlungen" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>}
    </div>
  )
}
