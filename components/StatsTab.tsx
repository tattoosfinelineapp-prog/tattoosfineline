'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'

type Stats = {
  profile_views: number
  likes_week: number
  saves_week: number
  followers_new: number
  top_photos: { id: string; url: string; saves_count: number; likes: number }[]
  total_photos: number
}

function motivationalMessage(total: number): string {
  if (total === 0) return 'Sube tu primera foto y empieza a crecer'
  if (total < 6)   return 'Buen comienzo, sigue subiendo tu trabajo'
  if (total < 11)  return 'Tu portfolio está tomando forma'
  if (total < 50)  return 'Tu portfolio está creciendo'
  return 'Eres de los más activos de la plataforma'
}

export default function StatsTab({ userId }: { userId: string }) {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [profileRes, photosRes, likesRes, savesRes, followersRes] = await Promise.all([
        supabase.from('users').select('profile_views').eq('id', userId).single(),
        supabase.from('photos').select('id, url, saves_count, likes').eq('tatuador_id', userId).eq('status', 'published').order('saves_count', { ascending: false }).limit(3),
        supabase.from('likes').select('id', { count: 'exact', head: true }).in(
          'photo_id',
          (await supabase.from('photos').select('id').eq('tatuador_id', userId).then(r => r.data?.map(p => p.id) ?? []))
        ).gte('created_at', weekAgo),
        supabase.from('saves').select('id', { count: 'exact', head: true }).in(
          'photo_id',
          (await supabase.from('photos').select('id').eq('tatuador_id', userId).then(r => r.data?.map(p => p.id) ?? []))
        ).gte('created_at', weekAgo),
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId).gte('created_at', weekAgo),
      ])

      const totalPhotos = photosRes.data?.length ?? 0
      setStats({
        profile_views: profileRes.data?.profile_views ?? 0,
        likes_week: likesRes.count ?? 0,
        saves_week: savesRes.count ?? 0,
        followers_new: followersRes.count ?? 0,
        top_photos: (photosRes.data ?? []) as Stats['top_photos'],
        total_photos: totalPhotos,
      })
      setLoading(false)
    }
    load()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">Cargando estadísticas...</div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Motivational message */}
      <div className="bg-gray-50 rounded-2xl px-4 py-3">
        <p className="text-sm text-gray-600">{motivationalMessage(stats.total_photos)}</p>
      </div>

      {/* Stats grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Esta semana</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Visitas al perfil', value: stats.profile_views },
            { label: 'Likes recibidos', value: stats.likes_week },
            { label: 'Veces guardado', value: stats.saves_week },
            { label: 'Seguidores nuevos', value: stats.followers_new },
          ].map(item => (
            <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top photos */}
      {stats.top_photos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Tus fotos más guardadas</h3>
          <div className="flex gap-3">
            {stats.top_photos.map(photo => (
              <Link
                key={photo.id}
                href={`/tattoo/${photo.id}`}
                className="relative group flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-100"
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 160px"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-xs font-medium">{photo.saves_count} guardados</p>
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {photo.saves_count}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
