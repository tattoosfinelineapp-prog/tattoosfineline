import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const LIMIT = 20

type UserRow = { id: string; nombre: string | null; username: string | null; avatar: string | null; tipo_cuenta: string | null }

type PhotoRow = {
  id: string
  url: string
  title: string | null
  tags: string[] | null
  likes: number
  saves_count: number | null
  height: number | null
  created_at: string
  tatuador_id: string | null
  users: UserRow | UserRow[] | null
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null

  const url    = new URL(req.url)
  const offset = parseInt(url.searchParams.get('offset') ?? '0')
  const seen   = url.searchParams.get('seen')?.split(',').filter(Boolean) ?? []

  const SELECT = 'id, url, title, tags, likes, saves_count, height, created_at, tatuador_id, users!tatuador_id(id, nombre, username, avatar, tipo_cuenta)'

  // Check if there are enough recent photos in 24h window
  const { count: recent24h } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())

  const isWeeklyFallback = (recent24h ?? 0) < 10
  const windowMs = isWeeklyFallback ? 7 * 24 * 3600 * 1000 : 48 * 3600 * 1000
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  // Fetch followed user IDs if logged in
  let followedIds: string[] = []
  if (userId) {
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)
    followedIds = (follows ?? []).map((r: { following_id: string }) => r.following_id)
  }

  const hasFollows = followedIds.length > 0

  // Liked/saved by current user
  let likedSet  = new Set<string>()
  let savedSet  = new Set<string>()
  if (userId) {
    const [likedRes, savedRes] = await Promise.all([
      supabase.from('likes').select('photo_id').eq('user_id', userId),
      supabase.from('saves').select('photo_id').eq('user_id', userId),
    ])
    likedSet = new Set((likedRes.data ?? []).map((r: { photo_id: string }) => r.photo_id))
    savedSet = new Set((savedRes.data ?? []).map((r: { photo_id: string }) => r.photo_id))
  }

  let photos: PhotoRow[] = []

  if (hasFollows) {
    const followedTarget    = Math.ceil(LIMIT * 0.6)
    const nonFollowedTarget = LIMIT - followedTarget

    const seenFilter = seen.length > 0 ? seen : ['00000000-0000-0000-0000-000000000000']

    const [r1, r2] = await Promise.all([
      supabase
        .from('photos')
        .select(SELECT)
        .eq('status', 'published')
        .in('tatuador_id', followedIds)
        .gte('created_at', windowStart)
        .not('id', 'in', `(${seenFilter.map(id => `'${id}'`).join(',')})`)
        .limit(followedTarget * 3),
      supabase
        .from('photos')
        .select(SELECT)
        .eq('status', 'published')
        .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order('likes', { ascending: false })
        .not('id', 'in', `(${seenFilter.map(id => `'${id}'`).join(',')})`)
        .limit(nonFollowedTarget * 3),
    ])

    const followedPool    = shuffle(r1.data ?? []).slice(0, followedTarget)
    const nonFollowedPool = shuffle(
      (r2.data ?? []).filter(p => !followedIds.includes(p.tatuador_id ?? ''))
    ).slice(0, nonFollowedTarget)

    // Avoid 2+ consecutive from same author
    const deduped: PhotoRow[] = []
    let lastAuthor = ''
    for (const p of followedPool) {
      if (p.tatuador_id !== lastAuthor) {
        deduped.push(p)
        lastAuthor = p.tatuador_id ?? ''
      } else {
        // Insert at random earlier position
        const pos = Math.floor(Math.random() * deduped.length)
        deduped.splice(pos, 0, p)
      }
    }

    photos = [...deduped, ...nonFollowedPool]
  } else {
    // No follows — just popular recent
    const { data } = await supabase
      .from('photos')
      .select(SELECT)
      .eq('status', 'published')
      .gte('created_at', windowStart)
      .order('likes', { ascending: false })
      .range(offset, offset + LIMIT - 1)
    photos = data ?? []
  }

  const enriched = photos.map(p => {
    const userRaw = p.users
    const fallback: UserRow = { id: p.tatuador_id ?? '', nombre: null, username: null, avatar: null, tipo_cuenta: null }
    const autor: UserRow = Array.isArray(userRaw)
      ? (userRaw[0] ?? fallback)
      : (userRaw ?? fallback)
    return {
      id:          p.id,
      url:         p.url,
      title:       p.title,
      tags:        p.tags,
      likes:       p.likes,
      saves_count: p.saves_count ?? 0,
      height:      p.height,
      created_at:  p.created_at,
      tatuador_id: p.tatuador_id,
      autor,
      ya_liked:    likedSet.has(p.id),
      ya_guardado: savedSet.has(p.id),
    }
  })

  return NextResponse.json({
    photos: enriched,
    hasFollows,
    isWeeklyFallback,
    offset: offset + enriched.length,
  })
}
