import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('[auth/callback] code present:', !!code)

  if (!code) {
    console.error('[auth/callback] No code in URL')
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session?.user) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'no session')
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  const user = data.session.user
  console.log('[auth/callback] session OK, user:', user.id, user.email, 'provider:', user.app_metadata?.provider)

  // Upsert into public.users — handle Google OAuth metadata correctly
  try {
    const admin = getAdminClient()
    const meta = user.user_metadata ?? {}

    const { error: upsertError } = await admin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        nombre: meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? '',
        avatar: meta.avatar_url ?? meta.picture ?? null,
        tipo: 'cliente',           // original schema column (NOT NULL)
        tipo_cuenta: 'inspiracion', // v2 schema column — default for Google sign-ups
      }, { onConflict: 'id', ignoreDuplicates: false })

    if (upsertError) {
      console.error('[auth/callback] upsert error:', upsertError.message)
    } else {
      console.log('[auth/callback] upsert OK for user:', user.id)
    }
  } catch (e) {
    console.error('[auth/callback] upsert exception:', e)
  }

  return NextResponse.redirect(new URL('/galeria', request.url))
}
