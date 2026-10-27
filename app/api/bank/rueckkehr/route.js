// Rückkehr von der Bank nach der Freigabe (Enable Banking leitet hierher weiter).
// Leitet mit Code und State auf die Seite „Bankkonten“ weiter; dort legt das angemeldete OS die Verbindung an.
export const dynamic = 'force-dynamic'
export async function GET(req) {
  const u = new URL(req.url)
  const q = new URLSearchParams()
  for (const k of ['code', 'state', 'error', 'error_description']) { const v = u.searchParams.get(k); if (v) q.set(k, v) }
  return Response.redirect(u.origin + '/buchhaltung/bankkonten?' + q.toString(), 302)
}
