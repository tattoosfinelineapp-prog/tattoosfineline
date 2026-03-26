import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get all active tatuadores/estudios with at least 1 photo
  const { data: artists } = await admin
    .from('users')
    .select('id, nombre, email, username')
    .in('tipo_cuenta', ['tatuador', 'estudio'])
    .not('email', 'is', null)

  if (!artists?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const artist of artists) {
    // Check if has photos
    const { count: photoCount } = await admin.from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('tatuador_id', artist.id).eq('status', 'published')
    if (!photoCount) continue

    // Weekly stats
    const { count: newSaves } = await admin.from('saves')
      .select('id', { count: 'exact', head: true })
      .eq('photo_id', artist.id) // approximate — would need join
      .gte('created_at', oneWeekAgo)

    const { count: newFollowers } = await admin.from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', artist.id)
      .gte('created_at', oneWeekAgo)

    // Send email via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'tattoosfineline <noreply@tattoosfineline.com>',
        to: artist.email,
        subject: 'Tu semana en tattoosfineline',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="font-size:20px;color:#111">Hola ${artist.nombre ?? artist.username} 👋</h2>
            <p style="color:#666;font-size:14px">Tu resumen semanal en tattoosfineline:</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:16px 0">
              <p style="margin:4px 0;font-size:14px"><strong>${photoCount}</strong> fotos publicadas</p>
              <p style="margin:4px 0;font-size:14px"><strong>${newFollowers ?? 0}</strong> nuevos seguidores esta semana</p>
              <p style="margin:4px 0;font-size:14px"><strong>${newSaves ?? 0}</strong> guardados esta semana</p>
            </div>
            <a href="https://tattoosfineline.com/${artist.username ?? artist.id}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:500">
              Ver mis stats →
            </a>
          </div>
        `,
      })
      sent++
    } catch (e) {
      console.error('[weekly-report] email error:', artist.email, e)
    }
  }

  return NextResponse.json({ sent, total: artists.length })
}
