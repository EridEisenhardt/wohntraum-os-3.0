'use client'
import { useParams } from 'next/navigation'

// Platzhalter für Seiten im Bereich Verwalto, die noch gebaut werden
const SEITEN = {
  fuhrpark: { titel: 'Fuhrpark', text: 'Fahrzeuge mit Kauf & Leasing, Zulassung & Steuer, Versicherung, Schäden & Bußgelder, TÜV & Wartung – aufgebaut wie in der Prozesslandkarte 3.0 (6.000 Fuhrpark).' },
  neuvermietung: { titel: 'Neuvermietung', text: 'Board für die Neuvermietung: Hier landen die Mietinteressenten, die Eric freigegeben hat.' },
  gesellschaften: { titel: 'Gesellschaften', text: 'Stammdaten der Gesellschaften (WT, EE, KiBo, WW, Andersmacher, Fly with Aly).' },
  dokumente: { titel: 'Dokumente', text: 'Hier wird die Dokumentenverwaltung eingebaut.' },
}

export default function VerwaltoPlatzhalter() {
  const p = useParams()
  const s = SEITEN[p && p.seite] || { titel: 'Seite', text: '' }
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, margin: '0 0 6px' }}>{s.titel}</h1>
      <div className="sub" style={{ marginBottom: 16 }}>Im Aufbau</div>
      <div className="card">{s.text}</div>
    </div>
  )
}
