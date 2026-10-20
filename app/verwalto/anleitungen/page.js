'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [src,setSrc]=useState('')
  useEffect(()=>{ const q=window.location.search||''; setSrc('/os-anleitungen.html?v=20261020c'+(q?'&'+q.slice(1):'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      {src && <iframe src={src} title="Anleitungen" allow="fullscreen" allowFullScreen style={{width:'100%',height:'100%',border:'none',display:'block'}}/>}
    </div>
  )
}
