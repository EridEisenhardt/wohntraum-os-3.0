'use client'
export default function KpiGfPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/gf-kpi.html"
        title="KPI GF Kennzahlen · Cashflow je Struktur"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}
