export const activityTypeLabel = {
  anruf: 'Anruf', email: 'E-Mail', termin: 'Termin',
  notiz: 'Notiz', besichtigung: 'Besichtigung', aufgabe: 'Aufgabe'
}
export const activityTypeIcon = {
  anruf: 'ti-phone', email: 'ti-mail', termin: 'ti-calendar',
  notiz: 'ti-note', besichtigung: 'ti-eye', aufgabe: 'ti-checkbox'
}
export const ACTIVITY_TYPES = Object.keys(activityTypeLabel)

export function toLocalInput(d) {
  const x = d ? new Date(d) : new Date()
  const off = x.getTimezoneOffset()
  const local = new Date(x.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}
