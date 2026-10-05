'use client'
import { useEffect, useState } from 'react'
export default function MietinteressentenPage() {
  const [src,setSrc]=useState('/mietinteressenten.html')
  useEffect(()=>{ setSrc('/mietinteressenten.html'+(window.location.search||'')) },[])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="Vermietung · Mietinteressenten" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
    </div>
  )
}
