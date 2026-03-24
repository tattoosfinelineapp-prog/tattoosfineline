import { createClient } from '@supabase/supabase-js'
import type { Tattoo } from './data'

// Cliente con las keys directas como fallback si las env vars no están disponibles en build
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

type PhotoRow = {
  id: string
  url: string
  title: string | null
  alt_text: string | null
  motivo: string | null
  zona: string | null
  tamaño: string | null
  tags: string[] | null
  likes: number
  height: number | null
  tatuador_id: string | null
  users: { nombre: string | null } | null
}

function mapPhoto(row: PhotoRow): Tattoo {
  return {
    id: row.id,
    url: row.url,
    title: row.title ?? '',
    alt_text: row.alt_text ?? '',
    motivo: row.motivo ?? '',
    zona: row.zona ?? '',
    tamaño: row.tamaño ?? '',
    tags: row.tags ?? [],
    tatuador: row.users?.nombre ?? 'Sinkply Tattoo',
    tatuador_id: row.tatuador_id ?? '',
    likes: row.likes ?? 0,
    height: row.height ?? 350,
  }
}

export async function getPhotos(limit = 2000): Promise<Tattoo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log('[getPhotos] url:', url ? url.slice(0, 30) + '...' : 'MISSING')
  console.log('[getPhotos] key:', key ? 'SET' : 'MISSING')
  if (!url || !key) {
    console.warn('[Supabase] Missing env vars — skipping fetch')
    return []
  }
  const supabase = getClient()
  const { data, error, count } = await supabase
    .from('photos')
    .select('id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users(nombre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  console.log('[getPhotos] count:', count, 'rows:', data?.length, 'error:', error?.message)

  if (error) {
    console.error('[Supabase] Error fetching photos:', error.message)
    return []
  }

  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getPhotosByTatuador(tatuador_id: string): Promise<Tattoo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const supabase = getClient()
  const { data, error } = await supabase
    .from('photos')
    .select('id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users(nombre)')
    .eq('tatuador_id', tatuador_id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Supabase] Error fetching by tatuador:', error.message)
    return []
  }

  return (data as unknown as PhotoRow[]).map(mapPhoto)
}
