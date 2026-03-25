import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUserByUsername, getUserById, getPhotosByTatuador, getSavedPhotos, getCarpetas } from '@/lib/queries'
import PerfilTabs from '@/components/PerfilTabs'
import FollowButton from '@/components/FollowButton'
import StatsTab from '@/components/StatsTab'
import { Instagram, Settings, Globe } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

type UserProfileWithStats = {
  followers_count?: number
  following_count?: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// TipoBadge uses hardcoded labels — translated at call site via t() passed as prop
function TipoBadge({ tipo, labelTatuador, labelEstudio }: { tipo: string | null; labelTatuador: string; labelEstudio: string }) {
  if (tipo === 'tatuador') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
        {labelTatuador}
      </span>
    )
  }
  if (tipo === 'estudio') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
        {labelEstudio}
      </span>
    )
  }
  return null
}

export default async function PerfilPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations('Perfil')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  // Support both UUID (legacy /perfil/uuid) and username (/perfil/username)
  const usuario = UUID_RE.test(params.slug)
    ? await getUserById(params.slug)
    : await getUserByUsername(params.slug)

  if (!usuario) notFound()

  const isOwnProfile = session?.user?.id === usuario.id

  // Check if current user follows this profile
  let isFollowing = false
  let followersCount = (usuario as UserProfileWithStats).followers_count ?? 0
  if (session?.user?.id && !isOwnProfile) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: followRow } = await admin
      .from('user_follows')
      .select('id')
      .eq('follower_id', session.user.id)
      .eq('following_id', usuario.id)
      .single()
    isFollowing = !!followRow
  }

  // Fetch updated followers count from DB
  {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: statsRow } = await admin
      .from('users')
      .select('followers_count')
      .eq('id', usuario.id)
      .single()
    followersCount = statsRow?.followers_count ?? 0
  }

  const [fotos, guardadas, carpetas] = await Promise.all([
    getPhotosByTatuador(usuario.id),
    getSavedPhotos(usuario.id),
    getCarpetas(usuario.id),
  ])

  const totalLikes = fotos.reduce((sum, f) => sum + (f.likes ?? 0), 0)
  const bannerUrl = fotos[0]?.url ?? null

  const displayName = usuario.tipo_cuenta === 'estudio'
    ? (usuario.nombre_estudio ?? usuario.nombre)
    : usuario.nombre

  return (
    <div className="pb-20">
      {/* Banner */}
      <div className="relative h-40 sm:h-56 bg-gray-100 overflow-hidden">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover opacity-60 blur-[2px] scale-105"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar + name row */}
        <div className="flex flex-wrap items-start justify-between gap-3 -mt-10 sm:-mt-14 mb-4">
          <div className="flex items-end gap-4">
            <div className="min-w-[80px] min-h-[80px] w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0">
              {usuario.avatar ? (
                <Image
                  src={usuario.avatar}
                  alt={displayName ?? ''}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-gray-400">
                    {(displayName ?? usuario.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="mb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight break-words">
                  {displayName ?? usuario.email.split('@')[0]}
                </h1>
                <TipoBadge tipo={usuario.tipo_cuenta} labelTatuador={t('tatuador')} labelEstudio={t('estudio')} />
              </div>
              {usuario.username && (
                <p className="text-sm text-gray-400 mt-0.5">@{usuario.username}</p>
              )}
              {usuario.ciudad && (
                <p className="text-xs text-gray-400 mt-0.5">{usuario.ciudad}</p>
              )}
            </div>
          </div>

          {isOwnProfile ? (
            <Link
              href="/perfil/editar"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              <Settings size={14} />
              {t('edit')}
            </Link>
          ) : (
            <FollowButton
              targetUserId={usuario.id}
              initialFollowing={isFollowing}
            />
          )}
        </div>

        {/* Bio + links */}
        <div className="mb-6 space-y-2">
          {usuario.bio && (
            <p className="text-sm text-gray-500 max-w-xl">{usuario.bio}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {usuario.instagram && (
              <a
                href={`https://instagram.com/${usuario.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Instagram size={13} />
                {usuario.instagram}
              </a>
            )}
            {usuario.web && (
              <a
                href={usuario.web.startsWith('http') ? usuario.web : `https://${usuario.web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Globe size={13} />
                {usuario.web.replace(/^https?:\/\//, '')}
              </a>
            )}
            {usuario.direccion && usuario.tipo_cuenta === 'estudio' && (
              <span className="text-sm text-gray-400">{usuario.direccion}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{fotos.length}</p>
            <p className="text-xs text-gray-400">{t('published')}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{followersCount.toLocaleString('es')}</p>
            <p className="text-xs text-gray-400">{t('followers')}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{totalLikes.toLocaleString('es')}</p>
            <p className="text-xs text-gray-400">{t('likes')}</p>
          </div>
        </div>

        {/* Tabs */}
        <PerfilTabs
          fotos={fotos}
          guardadas={guardadas}
          carpetas={carpetas}
          isOwnProfile={isOwnProfile}
          userId={usuario.id}
        />
      </div>
    </div>
  )
}
