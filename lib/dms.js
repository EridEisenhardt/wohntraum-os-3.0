export const docCategoryLabel = {
  vertrag_kauf: 'Kaufvertrag',
  vertrag_miete: 'Mietvertrag',
  vertrag_makler: 'Maklervertrag',
  expose: 'Exposé',
  objektunterlage: 'Objektunterlage',
  grundbuch: 'Grundbuchauszug',
  energieausweis: 'Energieausweis',
  behoerde: 'Behörde',
  rechnung: 'Rechnung',
  ausweis: 'Ausweis/Identität',
  sonstige: 'Sonstige'
}

export const docStatusLabel = {
  entwurf: 'Entwurf',
  final: 'Final',
  archiviert: 'Archiviert'
}

export const DOC_CATEGORIES = Object.keys(docCategoryLabel)
export const DOC_STATUS = Object.keys(docStatusLabel)

export function formatBytes(n) {
  if (!n && n !== 0) return '—'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export function expiryInfo(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  const days = Math.round((d - today) / 86400000)
  if (days < 0) return { kind: 'expired', label: 'abgelaufen' }
  if (days <= 60) return { kind: 'soon', label: 'läuft in ' + days + ' T. ab' }
  return { kind: 'ok', label: d.toLocaleDateString('de-DE') }
}
