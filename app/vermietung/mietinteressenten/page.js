'use client'
import { useEffect, useState } from 'react'
export default function MietinteressentenPage() {
  const [src,setSrc]=useState('/mietinteressenten.html?v=20261022b')
  useEffect(()=>{ setSrc('/mietinteressenten.html?v=20261022b'+(window.location.search?'&'+window.location.search.slice(1):'')) },[])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="Vermietung · Mietinteressenten" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
    </div>
  )
}
