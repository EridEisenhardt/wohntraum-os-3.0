'use client'
export default function VermoegensbilanzPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/vermoegensbilanz.html"
        title="Vermögensbilanz"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
