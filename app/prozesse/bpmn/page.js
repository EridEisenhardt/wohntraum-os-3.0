'use client'
export default function BpmnPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/bpmn.html"
        title="BPMN-Modellierung"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
