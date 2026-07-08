'use client'
export default function GpmTrackerPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/gpm-tracker.html"
        title="GPM-Tracker"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
