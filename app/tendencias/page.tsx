import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, MapPin, Heart, User } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // 24 hours

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function TendenciasPage() {
  const admin = getAdmin()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Top tags this week (from recent photos)
  const { data: recentPhotos } = await admin
    .from('photos')
    .select('tags')
    .eq('status', 'published')
    .gte('created_at', oneWeekAgo)
    .limit(200)

  const tagCounts: Record<string, number> = {}
  for (const p of recentPhotos ?? []) {
    for (const tag of (p.tags as string[]) ?? []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Most liked photo this week
  const { data: topPhotoData } = await admin
    .from('photos')
    .select('id, url, title, alt_text, likes, tags, users(nombre)')
    .eq('status', 'published')
    .order('likes', { ascending: false })
    .limit(1)
  const topPhoto = topPhotoData?.[0]

  // Most active tatuador (most uploads this week)
  const { data: recentUploads } = await admin
    .from('photos')
    .select('tatuador_id')
    .eq('status', 'published')
    .gte('created_at', oneWeekAgo)

  const uploaderCounts: Record<string, number> = {}
  for (const p of recentUploads ?? []) {
    if (p.tatuador_id) uploaderCounts[p.tatuador_id] = (uploaderCounts[p.tatuador_id] || 0) + 1
  }
  const topUploaderId = Object.entries(uploaderCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  let topUploader = null
  if (topUploaderId) {
    const { data } = await admin.from('users').select('id, nombre, username, avatar, ciudad').eq('id', topUploaderId).single()
    topUploader = data
  }

  // Total stats
  const { count: totalPhotos } = await admin.from('photos').select('id', { count: 'exact', head: true }).eq('status', 'published')
  const { count: totalUsers } = await admin.from('users').select('id', { count: 'exact', head: true })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-gray-900" />
          <h1 className="text-2xl font-semibold text-gray-900">Tendencias</h1>
        </div>
        <p className="text-sm text-gray-400">Lo más popular esta semana en tattoosfineline</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-2xl font-bold text-gray-900">{(totalPhotos ?? 0).toLocaleString('es')}</p>
          <p className="text-xs text-gray-400 mt-0.5">tatuajes publicados</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-2xl font-bold text-gray-900">{(totalUsers ?? 0).toLocaleString('es')}</p>
          <p className="text-xs text-gray-400 mt-0.5">usuarios</p>
        </div>
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Tags más populares</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/galeria?q=${encodeURIComponent(tag)}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-gray-400 transition-colors"
              >
                <span className="text-gray-900 font-medium">{tag}</span>
                <span className="text-xs text-gray-400">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Most liked photo */}
      {topPhoto && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Foto más popular</h2>
          <Link href={`/foto/${topPhoto.id}`} className="block rounded-2xl overflow-hidden bg-gray-100 relative group">
            <Image src={topPhoto.url} alt={topPhoto.alt_text ?? ''} width={600} height={400} className="w-full h-auto max-h-80 object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex items-center justify-between text-white">
                <span className="text-sm font-medium drop-shadow">
                  {(topPhoto.users as unknown as { nombre: string | null } | null)?.nombre ?? 'Artista'}
                </span>
                <span className="flex items-center gap-1 text-sm drop-shadow">
                  <Heart size={14} fill="white" /> {topPhoto.likes}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Most active tatuador */}
      {topUploader && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Artista más activo</h2>
          <Link
            href={`/perfil/${topUploader.username ?? topUploader.id}`}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0">
              {topUploader.avatar
                ? <Image src={topUploader.avatar} alt="" width={48} height={48} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-gray-400" /></div>
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{topUploader.nombre ?? topUploader.username}</p>
              {topUploader.ciudad && (
                <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {topUploader.ciudad}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{uploaderCounts[topUploader.id]} fotos esta semana</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
