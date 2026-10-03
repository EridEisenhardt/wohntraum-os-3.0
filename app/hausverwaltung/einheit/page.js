'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [src,setSrc]=useState('/hv-einheit.html')
  useEffect(()=>{ setSrc('/hv-einheit.html'+(window.location.search||'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      <iframe src={src} title="Einheit" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>
    </div>
  )
}
