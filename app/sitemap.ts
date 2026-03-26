import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://tattoosfineline.com'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/galeria`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/tendencias`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/buscar`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/mapa`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/buscar-artista`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // Published photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5000)

  for (const p of photos ?? []) {
    entries.push({
      url: `${base}/foto/${p.id}`,
      lastModified: p.created_at,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // Tatuador/estudio profiles
  const { data: users } = await supabase
    .from('users')
    .select('username, id')
    .in('tipo_cuenta', ['tatuador', 'estudio'])
    .not('username', 'is', null)
    .limit(2000)

  for (const u of users ?? []) {
    entries.push({
      url: `${base}/${u.username}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return entries
}
