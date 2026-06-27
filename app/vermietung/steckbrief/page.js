'use client'
export default function SteckbriefPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/steckbrief-generator.html"
        title="Wohnungs-Steckbrief Generator"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
