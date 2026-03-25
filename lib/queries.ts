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
  tipo_cuenta: string | null
  username: string | null
  ciudad: string | null
  nombre_estudio: string | null
  direccion: string | null
  web: string | null
  followers_count?: number
  following_count?: number
  last_upload_at?: string | null
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
      `title.ilike.%${query}%,motivo.ilike.%${query}%,zona.ilike.%${query}%,alt_text.ilike.%${query}%,tags.cs.{${query}}`
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
  // Fetch a larger set and shuffle server-side for variety on each load
  const { data, error } = await getClient()
    .from('photos')
    .select(SELECT_PHOTO)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit * 4)
  if (error) return []
  const all = (data as unknown as PhotoRow[]).map(mapPhoto)
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  return all.slice(0, limit)
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

const SELECT_USER = 'id, nombre, email, avatar, bio, instagram, tipo, tipo_cuenta, username, ciudad, nombre_estudio, direccion, web, followers_count, following_count, last_upload_at'

export async function getUserById(userId: string): Promise<UserProfile | null> {
  if (!hasEnvVars()) return null
  const { data, error } = await getClient()
    .from('users')
    .select(SELECT_USER)
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as UserProfile
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!hasEnvVars()) return null
  const { data, error } = await getClient()
    .from('users')
    .select(SELECT_USER)
    .eq('username', username)
    .single()
  if (error || !data) return null
  return data as UserProfile
}

export async function getTopTatuadores(limit = 6): Promise<UserProfile[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('users')
    .select(SELECT_USER)
    .in('tipo_cuenta', ['tatuador', 'estudio'])
    .order('followers_count', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as UserProfile[]
}

export async function searchUsers(query: string, tipo?: 'tatuador' | 'estudio'): Promise<UserProfile[]> {
  if (!hasEnvVars()) return []
  // Search across nombre, username AND nombre_estudio so "sinkply" finds the user
  let q = getClient()
    .from('users')
    .select(SELECT_USER)
    .or(`nombre.ilike.%${query}%,username.ilike.%${query}%,nombre_estudio.ilike.%${query}%`)
  if (tipo) q = q.eq('tipo_cuenta', tipo)
  const { data, error } = await q.order('followers_count', { ascending: false }).limit(20)
  if (error) return []
  return data as UserProfile[]
}

export type CarpetaPublica = {
  id: string
  nombre: string
  user_id: string
  tags_default: string[] | null
  created_at: string
  users: { nombre: string | null; username: string | null } | null
}

export async function searchCarpetas(query: string): Promise<CarpetaPublica[]> {
  if (!hasEnvVars()) return []
  const { data, error } = await getClient()
    .from('carpetas')
    .select('id, nombre, user_id, tags_default, created_at, users(nombre, username)')
    .ilike('nombre', `%${query}%`)
    .limit(20)
  if (error) return []
  return data as unknown as CarpetaPublica[]
}

export type LandingCarpeta = {
  id: string
  nombre: string
  foto_count: number
  cover_urls: string[]
}

export async function getLandingCarpetas(limit = 3): Promise<LandingCarpeta[]> {
  if (!hasEnvVars()) return []
  const client = getClient()

  // Get most recent carpetas that have saves
  const { data: carpetas } = await client
    .from('carpetas')
    .select('id, nombre')
    .order('created_at', { ascending: false })
    .limit(20)

  if (!carpetas || carpetas.length === 0) return []

  const results = await Promise.all(
    carpetas.map(async (c: { id: string; nombre: string }) => {
      const { data: saves, count } = await client
        .from('saves')
        .select('photo_id, photos!inner(url)', { count: 'exact' })
        .eq('carpeta_id', c.id)
        .limit(4)

      const coverUrls = ((saves ?? []) as unknown as { photos: { url: string } }[])
        .map(s => s.photos?.url)
        .filter(Boolean) as string[]

      return { id: c.id, nombre: c.nombre, foto_count: count ?? 0, cover_urls: coverUrls }
    })
  )

  // Sort by foto_count desc, return top limit
  return results
    .sort((a, b) => b.foto_count - a.foto_count)
    .slice(0, limit)
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
