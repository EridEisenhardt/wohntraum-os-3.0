'use client'
export default function ZahlungsvereinbarungPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/zahlungsvereinbarung.html"
        title="Ratenzahlung erstellen"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
