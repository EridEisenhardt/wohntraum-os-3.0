'use client'
export default function CashflowUebersichtPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/cashflow-uebersicht.html"
        title="Cashflow-Übersicht — 3 Ebenen"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
