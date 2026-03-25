import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/upload', '/guardar', '/tablero', '/perfil/editar']
const ADMIN_EMAIL = 'tattoosfinelineapp@gmail.com'
const ADMIN_ID    = 'c01f31dd-5898-4a95-9061-ab66c65102df'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Admin routes — verify by both email and ID (works with Google OAuth)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const isAdmin = session?.user?.email === ADMIN_EMAIL || session?.user?.id === ADMIN_ID
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return res
  }

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isProtected && !session) {
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('auth', 'login')
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
