'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [src,setSrc]=useState('')
  useEffect(()=>{ const q=window.location.search||''; setSrc('/hv-stoerungen.html?v=20261021b'+(q?'&'+q.slice(1):'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      {src && <iframe src={src} title="Störungsmeldungen" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>}
    </div>
  )
}
