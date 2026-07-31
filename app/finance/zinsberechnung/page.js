'use client'
export default function ZinsberechnungPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/zinsberechnung.html"
        title="Zinsberechnung"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
