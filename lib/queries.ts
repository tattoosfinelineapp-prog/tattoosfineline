import { createClient } from '@supabase/supabase-js'
import type { Tattoo } from './data'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

function hasEnvVars() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
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

export type UserProfile = {
  id: string
  nombre: string | null
  email: string
  avatar: string | null
  bio: string | null
  instagram: string | null
  tipo: string
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

const SELECT_PHOTO = 'id, url, title, alt_text, motivo, zona, tamaño, tags, likes, height, tatuador_id, users(nombre)'

export async function getPhotos(limit = 2000): Promise<Tattoo[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('[getPhotos]', error.message); return [] }
  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getPhotosPage(
  page: number,
  limit = 24,
  query?: string
): Promise<{ photos: Tattoo[]; total: number }> {
  if (!hasEnvVars()) return { photos: [], total: 0 }
  const from = page * limit
  const to = from + limit - 1
  const client = getClient()
  let q = client
    .from('photos')
    .select(SELECT_PHOTO, { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) {
    q = q.or(
      `title.ilike.%${query}%,motivo.ilike.%${query}%,zona.ilike.%${query}%,alt_text.ilike.%${query}%`
    )
  }

  const { data, error, count } = await q
  if (error) { console.error('[getPhotosPage]', error.message); return { photos: [], total: 0 } }
  return {
    photos: (data as unknown as PhotoRow[]).map(mapPhoto),
    total: count ?? 0,
  }
}

export async function getPhotoCount(): Promise<number> {
  if (!hasEnvVars()) return 0
  const { count } = await getClient()
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
  return count ?? 0
}

export async function getLandingPhotos(limit = 12): Promise<Tattoo[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('status', 'published')
    .order('likes', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getPhotoById(id: string): Promise<Tattoo | null> {
  if (!hasEnvVars()) return null
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('id', id)
    .single()
  if (error || !data) return null
  return mapPhoto(data as unknown as PhotoRow)
}

export async function getSimilarPhotos(motivo: string, currentId: string, limit = 12): Promise<Tattoo[]> {
  if (!hasEnvVars() || !motivo) return []
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('motivo', motivo)
    .neq('id', currentId)
    .order('likes', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getPhotosByTatuador(tatuador_id: string): Promise<Tattoo[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('tatuador_id', tatuador_id)
    .order('created_at', { ascending: false })
  if (error) { console.error('[getPhotosByTatuador]', error.message); return [] }
  return (data as unknown as PhotoRow[]).map(mapPhoto)
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  if (!hasEnvVars()) return null
  const { data, error } = await getClient()
    .from('users')
    .select('id, nombre, email, avatar, bio, instagram, tipo')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as UserProfile
}

export async function getSavedPhotos(userId: string): Promise<Tattoo[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('saves')
    .select(`photo_id, photos:photo_id(${SELECT_PHOTO})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data as unknown as { photos: PhotoRow }[])
    .map(r => r.photos)
    .filter(Boolean)
    .map(mapPhoto)
}

export type Carpeta = {
  id: string
  nombre: string
  user_id: string
  created_at: string
  count?: number
}

export async function getCarpetas(userId: string): Promise<Carpeta[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('carpetas')
    .select('id, nombre, user_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Carpeta[]
}
