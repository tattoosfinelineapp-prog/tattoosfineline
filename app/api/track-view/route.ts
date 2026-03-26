import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { profile_id } = await req.json()
  if (!profile_id) return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user?.id === profile_id) return NextResponse.json({ ok: true })

  const viewerCity = req.headers.get('x-vercel-ip-city') ?? null
  const viewerCountry = req.headers.get('x-vercel-ip-country') ?? null
  const viewerIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Insert view (unique index prevents duplicates per day/IP)
  try {
    await admin.from('profile_views_log').insert({
      profile_id,
      viewer_id: session?.user?.id ?? null,
      viewer_ip: viewerIp,
      viewer_city: viewerCity,
      viewer_country: viewerCountry,
    })
  } catch {} // Ignore duplicates

  // Increment counter
  try {
    const { data } = await admin.from('users').select('profile_views').eq('id', profile_id).single()
    if (data) {
      await admin.from('users').update({ profile_views: (data.profile_views ?? 0) + 1 }).eq('id', profile_id)
    }
  } catch {}

  return NextResponse.json({ ok: true })
}
