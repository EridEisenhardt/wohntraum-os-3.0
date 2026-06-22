'use client'
export default function GfDashboardPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe src="/gf-dashboard.html" title="GF-Dashboard"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
    </div>
  )
}
