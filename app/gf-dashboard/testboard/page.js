'use client'
import { useEffect, useState } from 'react'
export default function Page(){
  const [src,setSrc]=useState('/gf-testboard.html')
  useEffect(()=>{ setSrc('/gf-testboard.html'+(window.location.search||'')) },[])
  return (
    <div style={{margin:'-26px -30px',height:'100vh'}}>
      <iframe src={src} title="GF Testboard" style={{width:'100%',height:'100%',border:'none',display:'block'}}/>
    </div>
  )
}
