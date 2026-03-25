import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Always redirect to the production domain, not .vercel.app
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://tattoosfineline.com'
  const code = searchParams.get('code')

  console.log('[auth/callback] code present:', !!code)

  if (!code) {
    console.error('[auth/callback] No code in URL')
    return NextResponse.redirect(new URL('/?error=auth_failed', origin))
  }

  // IMPORTANT: call cookies() first, then pass as () => cookieStore
  // so auth-helpers can write Set-Cookie headers on this response.
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session?.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'no session')
    return NextResponse.redirect(new URL('/?error=auth_failed', origin))
  }

  const user = data.session.user
  console.log('[auth/callback] session user:', data.session?.user?.email)
  console.log('[auth/callback] session OK, user:', user.id, 'provider:', user.app_metadata?.provider)

  // Upsert public.users via service role (bypasses RLS, handles Google metadata)
  let isNewUser = false
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const meta = user.user_metadata ?? {}

    const { data: existing } = await admin
      .from('users')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    isNewUser = !existing

    const { error: upsertError } = await admin
      .from('users')
      .upsert({
        id:          user.id,
        email:       user.email ?? '',
        nombre:      meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? '',
        avatar:      meta.avatar_url ?? meta.picture ?? null,
        tipo:        'cliente',
        tipo_cuenta: 'inspiracion',
        username:    (meta.email ?? user.email ?? '')
                       .split('@')[0]
                       .toLowerCase()
                       .replace(/[^a-z0-9_]/g, '') || null,
      }, { onConflict: 'id', ignoreDuplicates: false })

    if (upsertError) {
      console.error('[auth/callback] upsert error:', upsertError.message)
    } else {
      console.log('[auth/callback] upsert OK, isNew:', isNewUser)
    }
  } catch (e) {
    console.error('[auth/callback] upsert exception:', e)
  }

  const dest = isNewUser ? '/onboarding' : '/galeria'
  return NextResponse.redirect(new URL(dest, origin))
}
