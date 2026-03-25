import { NextResponse } from 'next/server'
import { requireAdmin, getAdminClient } from '../_auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const [
    { count: totalFotos },
    { count: totalUsuarios },
    { count: fotosHoy },
    { count: usuariosHoy },
    { count: reportadas },
    { data: ultimasFotos },
  ] = await Promise.all([
    admin.from('photos').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('photos').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    admin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    admin.from('photos').select('id', { count: 'exact', head: true }).eq('status', 'review'),
    admin.from('photos')
      .select('id, url, title, status, created_at, users(nombre)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    totalFotos: totalFotos ?? 0,
    totalUsuarios: totalUsuarios ?? 0,
    fotosHoy: fotosHoy ?? 0,
    usuariosHoy: usuariosHoy ?? 0,
    reportadas: reportadas ?? 0,
    ultimasFotos: ultimasFotos ?? [],
  })
}
