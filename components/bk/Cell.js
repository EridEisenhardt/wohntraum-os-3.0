'use client'
import { useEffect, useState } from 'react'

// Inline bearbeitbare Tabellenzelle. Speichert beim Verlassen des Feldes (onBlur) bzw. bei Auswahl.
// type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
export default function Cell({ value, onSave, type = 'text', options = [], width, placeholder, align }) {
  const [v, setV] = useState(value ?? '')
  const [state, setState] = useState('') // '', 'saving', 'ok', 'err'
  useEffect(() => { setV(value ?? '') }, [value])

  async function commit(next) {
    let out = next
    if (type === 'number') out = next === '' || next == null ? null : Number(String(next).replace(',', '.'))
    if (type === 'date') out = next || null
    if ((value ?? '') === (out ?? '')) return
    setState('saving')
    const ok = await onSave(out)
    setState(ok === false ? 'err' : 'ok')
    if (ok !== false) setTimeout(() => setState(''), 900)
  }

  const style = {
    width: width || '100%', font: 'inherit', fontSize: 13, padding: '5px 7px', borderRadius: 7,
    border: '1px solid ' + (state === 'err' ? '#e5484d' : state === 'ok' ? '#30a46c' : 'var(--line)'),
    background: 'var(--surface)', color: 'inherit', textAlign: align || (type === 'number' ? 'right' : 'left'),
  }

  if (type === 'checkbox') {
    return <input type="checkbox" checked={!!value} onChange={(e) => commit(e.target.checked)} />
  }
  if (type === 'select') {
    return (
      <select style={style} value={v} onChange={(e) => { setV(e.target.value); commit(e.target.value || null) }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    )
  }
  return (
    <input
      style={style}
      type={type === 'number' ? 'text' : type}
      inputMode={type === 'number' ? 'decimal' : undefined}
      value={type === 'number' && v !== '' && v != null ? String(v).replace('.', ',') : v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}
