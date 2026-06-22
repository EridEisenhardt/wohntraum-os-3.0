export const sampleContacts = [
  { id: 's1', first_name: 'Markus', last_name: 'Becker', email: 'm.becker@example.de', phone_mobile: '+49 151 2345678', city: 'Mainz', roles: ['kaeufer'], company: null },
  { id: 's2', first_name: 'Sabine', last_name: 'Lang', email: 's.lang@example.de', phone_mobile: '+49 160 9988776', city: 'Nieder-Olm', roles: ['verkaeufer'], company: null },
  { id: 's3', first_name: 'Thomas', last_name: 'Wolf', email: 'kanzlei@notariat-wolf.de', phone_mobile: '+49 6131 445566', city: 'Mainz', roles: ['notar'], company: { name: 'Notariat Dr. Wolf' } },
  { id: 's4', first_name: 'Julia', last_name: 'Hoffmann', email: 'j.hoffmann@example.de', phone_mobile: '+49 152 3344556', city: 'Ingelheim', roles: ['mieter'], company: null },
  { id: 's5', first_name: 'Peter', last_name: 'Schneider', email: 'p.schneider@sparkasse-mainz.de', phone_mobile: '+49 6131 778899', city: 'Mainz', roles: ['finanzierer'], company: { name: 'Sparkasse Mainz' } },
  { id: 's6', first_name: 'Andrea', last_name: 'Vogel', email: 'a.vogel@example.de', phone_mobile: '+49 170 1122334', city: 'Bingen', roles: ['kaeufer', 'verkaeufer'], company: null }
]

export const sampleCompanies = [
  { id: 'c1', name: 'Notariat Dr. Wolf', company_type: 'notariat', city: 'Mainz', phone: '+49 6131 445566', email: 'kanzlei@notariat-wolf.de' },
  { id: 'c2', name: 'Sparkasse Mainz', company_type: 'bank', city: 'Mainz', phone: '+49 6131 778899', email: 'baufi@sparkasse-mainz.de' },
  { id: 'c3', name: 'Elektro Krieger GmbH', company_type: 'dienstleister', city: 'Nieder-Olm', phone: '+49 6136 112233', email: 'info@elektro-krieger.de' },
  { id: 'c4', name: 'Rheinhessen Bau AG', company_type: 'bautraeger', city: 'Worms', phone: '+49 6241 556677', email: 'kontakt@rheinhessen-bau.de' },
  { id: 'c5', name: 'Vermögensverwaltung Süd', company_type: 'investor', city: 'Ingelheim', phone: '+49 6132 998877', email: 'office@vv-sued.de' }
]

export const roleLabel = {
  kaeufer: 'Käufer', verkaeufer: 'Eigentümer', mieter: 'Mieter',
  partner: 'Partner', notar: 'Notar', finanzierer: 'Finanzierer'
}

export const companyTypeLabel = {
  dienstleister: 'Dienstleister', notariat: 'Notariat', bank: 'Bank',
  bautraeger: 'Bauträger', investor: 'Investor', verwaltung: 'Verwaltung', sonstige: 'Sonstige'
}
