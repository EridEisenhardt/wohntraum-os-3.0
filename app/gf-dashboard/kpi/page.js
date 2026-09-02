'use client'
export default function KpiGfPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/cashflow-uebersicht.html"
        title="KPI GF · Cashflow je Struktur"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}
