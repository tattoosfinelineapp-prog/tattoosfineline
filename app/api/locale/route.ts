import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const { locale } = await req.json()
  if (locale !== 'es' && locale !== 'en') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }
  cookies().set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  return NextResponse.json({ ok: true })
}
