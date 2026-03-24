import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/upload', '/guardar', '/tablero', '/perfil/editar']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

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
