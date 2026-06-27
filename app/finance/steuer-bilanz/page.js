'use client'
export default function SteuerBilanzPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/steuer-bilanz.html"
        title="Steuer und Bilanzunterlagen"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
