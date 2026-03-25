'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Bookmark } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'

export type FeedPhoto = {
  id: string
  url: string
  title: string | null
  tags: string[] | null
  likes: number
  saves_count: number
  height: number | null
  created_at: string
  tatuador_id: string | null
  ya_liked: boolean
  ya_guardado: boolean
  autor: {
    id: string
    nombre: string | null
    username: string | null
    avatar: string | null
    tipo_cuenta: string | null
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export default function FeedCard({ photo }: { photo: FeedPhoto }) {
  const { user, toggleLike, openSaveModal, openAuthModal } = useAuth()
  const router = useRouter()

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleLike(photo.id)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { openAuthModal(); return }
    openSaveModal(photo.id)
  }

  const firstTag = photo.tags?.[0]

  const profileHref = photo.autor.username
    ? `/${photo.autor.username}`
    : photo.autor.id ? `/${photo.autor.id}` : '#'

  return (
    <article className="bg-white border-b border-gray-100 pb-4 mb-2">
      {/* Author row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href={profileHref} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {photo.autor.avatar ? (
              <Image
                src={photo.autor.avatar}
                alt=""
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                {photo.autor.nombre?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
              {photo.autor.nombre ?? 'Tatuador'}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(photo.created_at)}</p>
          </div>
        </Link>
        <span className="text-xs text-gray-400 shrink-0">{timeAgo(photo.created_at)}</span>
      </div>

      {/* Photo */}
      <Link href={`/tattoo/${photo.id}`}>
        <div className="relative bg-gray-50 w-full overflow-hidden">
          <Image
            src={photo.url}
            alt={photo.title ?? 'Tatuaje fine line'}
            width={600}
            height={photo.height ?? 500}
            className="w-full h-auto block"
            sizes="(max-width: 640px) 100vw, 600px"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Actions + tags */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart
                size={20}
                className={`transition-all ${
                  photo.ya_liked ? 'fill-red-500 text-red-500 scale-110' : ''
                }`}
                strokeWidth={photo.ya_liked ? 0 : 1.8}
              />
              <span className="text-xs">{photo.likes}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Bookmark
                size={20}
                className={photo.ya_guardado ? 'fill-gray-900 text-gray-900' : ''}
                strokeWidth={photo.ya_guardado ? 0 : 1.8}
              />
              {photo.saves_count > 0 && (
                <span className="text-xs">{photo.saves_count}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {photo.tags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => router.push(`/galeria?q=${encodeURIComponent(tag)}`)}
                className="px-2.5 py-0.5 bg-gray-50 text-xs text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
