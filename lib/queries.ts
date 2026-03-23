import { supabase } from './supabase'
import type { Tattoo } from './data'

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
    tatuador: row.users?.nombre ?? 'Tatuador',
    tatuador_id: row.tatuador_id ?? '',
    likes: row.likes ?? 0,
    height: row.height ?? 350,
  }
}

export async function getPhotos(): Promise<Tattoo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users(nombre)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error.message)
    return []
  }

  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getPhotosByTatuador(tatuador_id: string): Promise<Tattoo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users(nombre)')
    .eq('tatuador_id', tatuador_id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos by tatuador:', error.message)
    return []
  }

  return (data as unknown as PhotoRow[]).map(mapPhoto)
}
