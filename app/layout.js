import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata = {
  title: 'Wohntraum Rheinhessen OS',
  description: 'Steuerungs-Cockpit'
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
