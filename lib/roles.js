export const appRoleLabel = {
  admin: 'Geschäftsführung (Admin)',
  backoffice: 'Backoffice & Buchhaltung',
  hausverwaltung: 'Hausverwaltung',
  hausmeister: 'Hausmeisterdienst',
  vertrieb: 'Vertrieb',
  makler: 'Makler',
  bauleiter: 'Bauleiter',
  investor: 'Investorenansicht'
}
export const appRoleDesc = {
  admin: 'Vollzugriff inkl. Löschen, Rechteverwaltung und Nutzeranlage',
  backoffice: 'Rechnungen, Ratenzahlung, Personal, Controlling; Finanzen lesend',
  hausverwaltung: 'Vermietung, Aktivitäten, CRM; keine Finanz-/Personaldaten',
  hausmeister: 'Aufgaben, Reparaturen, Übergaben; keine Stammdaten löschen',
  vertrieb: 'Ankauf, Vermietung, CRM, Dashboards',
  makler: 'Vorbereitet – Rechte über Nutzerverwaltung freischalten',
  bauleiter: 'Vorbereitet – Rechte über Nutzerverwaltung freischalten',
  investor: 'Vorbereitet – reine Ansicht, Rechte über Nutzerverwaltung'
}
export const APP_ROLES = ['admin', 'backoffice', 'hausverwaltung', 'hausmeister', 'vertrieb', 'makler', 'bauleiter', 'investor']

// Module = fachliche Bereiche, für die Rechte vergeben werden.
export const APP_MODULES = [
  { key: 'dashboards', label: 'Dashboards & Portfolio', hint: 'GF-Dashboard, Portfolio, Strategie, Baustandard' },
  { key: 'crm', label: 'CRM & Tickets', hint: 'Kontakte, Deals, Ticketsystem' },
  { key: 'aktivitaeten', label: 'Aktivitäten & Reparaturen', hint: 'Aufgaben, Mieter-/Reparaturmeldungen' },
  { key: 'ankauf', label: 'Ankauf / Akquise', hint: 'Immobilien-Akquise' },
  { key: 'vermietung', label: 'Vermietung', hint: 'Mietinteressenten, Wohnungsvermietung, laufende, Steckbrief' },
  { key: 'ratenzahlung', label: 'Ratenzahlung', hint: 'Zahlungsvereinbarungen' },
  { key: 'controlling', label: 'Rechnungen & Controlling', hint: 'Fixkosten, Rechnungen Unternehmen, Statistik, Monatswechsel' },
  { key: 'personal', label: 'Personal', hint: 'Lohn, Urlaub, Krankheit, Personalakte, Arbeitsstunden' },
  { key: 'finance', label: 'Finance & Bank', hint: 'Darlehen, Selbstauskunft, Reporting, Steuer/Bilanz, Liquidität' },
  { key: 'produktivitaet', label: 'Produktivität', hint: 'Tracking, Wochenplanung, GPM, Statusbericht, Stundengehalt' },
  { key: 'dokumente', label: 'Dokumente & Stammdaten', hint: 'Dokumente, Stammdaten Kontakte/Firmen' }
]

export const PERM_LEVELS = [
  { key: 'sehen', label: 'Sehen' },
  { key: 'lesen', label: 'Lesen' },
  { key: 'schreiben', label: 'Schreiben' },
  { key: 'bearbeiten', label: 'Bearbeiten' },
  { key: 'loeschen', label: 'Löschen' }
]
