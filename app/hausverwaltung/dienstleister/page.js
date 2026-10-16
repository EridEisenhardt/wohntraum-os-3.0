'use client'
import { useEffect, useState } from 'react'
export default function HvDienstleisterPage() {
  const [src,setSrc]=useState('/hv-dienstleister.html?v=20261016a')
  useEffect(()=>{ setSrc('/hv-dienstleister.html?v=20261016a'+(window.location.search?'&'+window.location.search.slice(1):'')) },[])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="Firmen & Dienstleister" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
    </div>
  )
}
