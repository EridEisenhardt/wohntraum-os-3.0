'use client'
export default function WohnungsvermietungBpmnPage() {
  return (
    <div style={{ margin: '-26px -30px', height: '100vh' }}>
      <iframe
        src="/bpmn.html?name=Wohnungsvermietung-Prozess"
        title="Wohnungsvermietung · BPMN"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
