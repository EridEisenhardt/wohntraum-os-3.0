'use client'
import { useEffect, useState } from 'react'
export default function HvDienstleisterPage() {
  const [src,setSrc]=useState('/hv-dienstleister.html')
  useEffect(()=>{ setSrc('/hv-dienstleister.html'+(window.location.search||'')) },[])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="Firmen & Dienstleister" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
    </div>
  )
}
