'use client'
import { useEffect, useState } from 'react'
export default function SelbstauskuenftePage() {
  const [src, setSrc] = useState('/vm-selbstauskuenfte.html?v=20261022a')
  useEffect(() => { const q = window.location.search; setSrc('/vm-selbstauskuenfte.html?v=20261022a' + (q ? '&' + q.slice(1) : '')) }, [])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src={src} title="Selbstauskünfte" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
    </div>
  )
}
