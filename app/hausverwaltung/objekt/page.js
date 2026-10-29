'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [src,setSrc]=useState('/hv-objekt.html')
  useEffect(()=>{ const q=window.location.search||''; setSrc('/hv-objekt.html?v=20261029a'+(q?'&'+q.slice(1):'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      <iframe src={src} title="Objekt" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>
    </div>
  )
}
