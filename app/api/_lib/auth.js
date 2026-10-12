// Prüft, ob die Anfrage von einem angemeldeten Nutzer des Wohntraum OS kommt (Supabase-Session).
export async function angemeldet(req) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const r = await fetch(url + '/auth/v1/user', { headers: { apikey: key, Authorization: auth }, cache: 'no-store' })
  if (!r.ok) return null
  const u = await r.json()
  return u && u.id ? u : null
}
export const antwort = (o, status = 200) => Response.json(o, { status })
