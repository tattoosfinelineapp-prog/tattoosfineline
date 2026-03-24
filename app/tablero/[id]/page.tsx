'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import GaleriaGrid from '@/components/GaleriaGrid'
import type { Tattoo } from '@/lib/data'

export default function TableroPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient()
  const [nombre, setNombre] = useState('')
  const [fotos, setFotos] = useState<Tattoo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [carpetaRes, savesRes] = await Promise.all([
        supabase.from('carpetas').select('nombre').eq('id', params.id).single(),
        supabase
          .from('saves')
          .select('photos:photo_id(id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users:tatuador_id(nombre))')
          .eq('carpeta_id', params.id)
          .order('created_at', { ascending: false }),
      ])

      if (carpetaRes.data) setNombre(carpetaRes.data.nombre)

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
          id: p!.id,
          url: p!.url,
          title: p!.title ?? '',
          alt_text: p!.alt_text ?? '',
          motivo: p!.motivo ?? '',
          zona: p!.zona ?? '',
          tamaño: p!.tamaño ?? '',
          tags: p!.tags ?? [],
          tatuador: p!.users?.nombre ?? 'Sinkply Tattoo',
          tatuador_id: p!.tatuador_id ?? '',
          likes: p!.likes ?? 0,
          height: p!.height ?? 350,
        }))

      setFotos(mapped)
      setLoading(false)
    }
    load()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/guardar" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={16} />
        Guardados
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{nombre || 'Carpeta'}</h1>
        <p className="text-sm text-gray-400 mt-1">{fotos.length} fotos</p>
      </div>

      <GaleriaGrid tattoos={fotos} />
    </div>
  )
}
