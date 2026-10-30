'use client'
import { useEffect, useState } from 'react'
export default function TicketsPage() {
  const [src, setSrc] = useState('/tickets.html')
  useEffect(() => { setSrc('/tickets.html' + (window.location.search || '')) }, [])
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src={src}
        title="Ticketsystem"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
