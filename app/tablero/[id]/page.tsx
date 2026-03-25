'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Heart, Eye, Loader2, Plus } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import GaleriaGrid from '@/components/GaleriaGrid'
import type { Tattoo } from '@/lib/data'
import { useAuth } from '@/components/AuthContext'

type TableroMeta = {
  id: string
  nombre: string
  user_id: string
  likes_count: number
  views_count: number
  author: string | null
}

export default function TableroPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient()
  const { user } = useAuth()
  const [meta, setMeta] = useState<TableroMeta | null>(null)
  const [fotos, setFotos] = useState<Tattoo[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  useEffect(() => {
    async function load() {
      const [carpetaRes, savesRes] = await Promise.all([
        supabase
          .from('carpetas')
          .select('id, nombre, user_id, likes_count, views_count, users:user_id(nombre)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('saves')
          .select(`photos:photo_id(
            id, url, title, alt_text, motivo, zona, tamaño,
            tags, likes, height, tatuador_id, users:tatuador_id(nombre)
          )`)
          .eq('carpeta_id', params.id)
          .order('created_at', { ascending: false }),
      ])

      if (carpetaRes.data) {
        const d = carpetaRes.data as unknown as {
          id: string; nombre: string; user_id: string
          likes_count: number | null; views_count: number | null
          users: { nombre: string | null } | null
        }
        setMeta({
          id: d.id,
          nombre: d.nombre,
          user_id: d.user_id,
          likes_count: d.likes_count ?? 0,
          views_count: d.views_count ?? 0,
          author: d.users?.nombre ?? null,
        })
        setLikesCount(d.likes_count ?? 0)
      }

      type Row = {
        photos: {
          id: string; url: string; title: string | null; alt_text: string | null
          motivo: string | null; zona: string | null; tamaño: string | null
          tags: string[] | null; likes: number; height: number | null
          tatuador_id: string | null; users: { nombre: string | null } | null
        } | null
      }

      const mapped: Tattoo[] = ((savesRes.data ?? []) as unknown as Row[])
        .map(r => r.photos)
        .filter(Boolean)
        .map(p => ({
          id: p!.id, url: p!.url,
          title: p!.title ?? '', alt_text: p!.alt_text ?? '',
          motivo: p!.motivo ?? '', zona: p!.zona ?? '', tamaño: p!.tamaño ?? '',
          tags: p!.tags ?? [],
          tatuador: p!.users?.nombre ?? 'Sinkply Tattoo',
          tatuador_id: p!.tatuador_id ?? '',
          likes: p!.likes ?? 0, height: p!.height ?? 350,
          saves_count: 0, views_count: 0, ciudad: '',
        }))

      setFotos(mapped)
      setLoading(false)

      // Check if current user liked this tablero
      if (user) {
        const { data: likeData } = await supabase
          .from('tablero_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('tablero_id', params.id)
          .maybeSingle()
        if (likeData) setLiked(true)
      }
    }
    load()
  }, [params.id, supabase, user])

  const handleLike = async () => {
    if (!user) return
    if (liked) {
      setLiked(false)
      setLikesCount(c => Math.max(0, c - 1))
      await supabase.from('tablero_likes').delete()
        .eq('user_id', user.id).eq('tablero_id', params.id)
    } else {
      setLiked(true)
      setLikesCount(c => c + 1)
      await supabase.from('tablero_likes').insert({ user_id: user.id, tablero_id: params.id })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    )
  }

  const bannerPhotos = fotos.slice(0, 4)
  const isOwner = user?.id === meta?.user_id

  return (
    <div className="pb-24">
      {/* Banner collage */}
      <div className="relative h-48 sm:h-64 bg-gray-100 overflow-hidden">
        {bannerPhotos.length >= 4 ? (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
            {bannerPhotos.map(p => (
              <div key={p.id} className="relative overflow-hidden">
                <Image src={p.url} alt="" fill className="object-cover" sizes="50vw" />
              </div>
            ))}
          </div>
        ) : bannerPhotos.length > 0 ? (
          <Image src={bannerPhotos[0].url} alt="" fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <Link
          href="/guardar"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Guardados
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mt-6 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{meta?.nombre ?? 'Tablero'}</h1>
            {meta?.author && (
              <p className="text-sm text-gray-400 mt-0.5">por {meta.author}</p>
            )}
          </div>
          {isOwner && (
            <Link
              href="/galeria"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              <Plus size={14} />
              Añadir
            </Link>
          )}
        </div>

        {/* Stats + like */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <span className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{fotos.length}</span> fotos
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Eye size={14} className="text-gray-400" />
            {(meta?.views_count ?? 0).toLocaleString('es')} visitas
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Heart size={14} className="text-gray-400" />
            {likesCount.toLocaleString('es')} likes
          </span>

          {user && (
            <button
              onClick={handleLike}
              className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                liked
                  ? 'bg-red-50 text-red-500 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              {liked ? 'Te gusta' : 'Me gusta'}
            </button>
          )}
        </div>

        <GaleriaGrid tattoos={fotos} />

        {fotos.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>Este tablero está vacío</p>
            {isOwner && (
              <Link href="/galeria" className="text-sm text-gray-500 hover:text-gray-800 underline mt-2 block">
                Guarda fotos desde la galería
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
