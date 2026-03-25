import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/upload', '/guardar', '/tablero', '/perfil/editar']
const ADMIN_EMAIL = 'tattoosfinelineapp@gmail.com'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Admin routes — only for the admin email
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session || session.user.email !== ADMIN_EMAIL) {
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
