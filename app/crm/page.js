'use client'
import { useEffect, useState } from 'react'
export default function CrmPage() {
  const [src,setSrc]=useState('/crm.html')
  useEffect(()=>{ setSrc('/crm.html'+(window.location.search||'')) },[])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="CRM" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}/>
    </div>
  )
}
