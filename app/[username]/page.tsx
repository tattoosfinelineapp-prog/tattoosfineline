import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUserByUsername, getUserById, getPhotosByTatuador, getSavedPhotos, getCarpetas } from '@/lib/queries'
import PerfilTabs from '@/components/PerfilTabs'
import FollowButton from '@/components/FollowButton'
import MessageButton from '@/components/MessageButton'
import ProfileViewTracker from '@/components/ProfileViewTracker'
import StatsTab from '@/components/StatsTab'
import { Instagram, Settings, Globe } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const RESERVED = new Set([
  'galeria', 'buscar', 'mapa', 'feed', 'admin', 'upload', 'mensajes',
  'tendencias', 'buscar-artista', 'foto', 'perfil', 'onboarding', 'auth',
  'api', 'terminos', 'privacidad', 'cookies', 'dmca', 'tattoo', 'tablero',
  'guardar', 'explorar', 'not-found', 'loading', '_next',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type UserProfileWithStats = {
  followers_count?: number
  following_count?: number
}

function TipoBadge({ tipo, labelTatuador, labelEstudio }: { tipo: string | null; labelTatuador: string; labelEstudio: string }) {
  if (tipo === 'tatuador') return <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">{labelTatuador}</span>
  if (tipo === 'estudio') return <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">{labelEstudio}</span>
  return null
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const slug = params.username

  // Skip reserved routes — let Next.js handle them
  if (RESERVED.has(slug.toLowerCase())) notFound()

  const t = await getTranslations('Perfil')
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const usuario = UUID_RE.test(slug)
    ? await getUserById(slug)
    : await getUserByUsername(slug)

  if (!usuario) notFound()

  const isOwnProfile = session?.user?.id === usuario.id

  let isFollowing = false
  let followersCount = (usuario as UserProfileWithStats).followers_count ?? 0
  if (session?.user?.id && !isOwnProfile) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: followRow } = await admin.from('user_follows').select('id')
      .eq('follower_id', session.user.id).eq('following_id', usuario.id).single()
    isFollowing = !!followRow
  }

  {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: statsRow } = await admin.from('users').select('followers_count, messages_enabled')
      .eq('id', usuario.id).single()
    followersCount = statsRow?.followers_count ?? 0
    var messagesEnabled = statsRow?.messages_enabled ?? false
  }

  const [fotos, guardadas, carpetas] = await Promise.all([
    getPhotosByTatuador(usuario.id),
    getSavedPhotos(usuario.id),
    getCarpetas(usuario.id),
  ])

  const totalLikes = fotos.reduce((sum, f) => sum + (f.likes ?? 0), 0)

  const displayName = usuario.tipo_cuenta === 'estudio'
    ? (usuario.nombre_estudio ?? usuario.nombre)
    : usuario.nombre

  return (
    <div className="pb-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Avatar + name */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-4">
          <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {usuario.avatar ? (
              <Image src={usuario.avatar} alt={displayName ?? ''} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-400">{(displayName ?? usuario.email)[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900">{displayName ?? usuario.email.split('@')[0]}</h1>
              <TipoBadge tipo={usuario.tipo_cuenta} labelTatuador={t('tatuador')} labelEstudio={t('estudio')} />
            </div>
            {usuario.username && <p className="text-sm text-gray-500">@{usuario.username}</p>}
            {usuario.ciudad && <p className="text-xs text-gray-400 mt-0.5">{usuario.ciudad}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 mb-6">
          {isOwnProfile ? (
            <Link href="/perfil/editar" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
              <Settings size={14} /> {t('edit')}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <FollowButton targetUserId={usuario.id} initialFollowing={isFollowing} />
              <MessageButton targetUserId={usuario.id} targetName={displayName ?? usuario.email.split('@')[0]} targetAvatar={usuario.avatar} messagesEnabled={messagesEnabled} />
            </div>
          )}
        </div>

        {/* View tracker */}
        {!isOwnProfile && <ProfileViewTracker profileId={usuario.id} />}

        {/* Bio + chips */}
        <div className="mb-6 space-y-3">
          {usuario.bio && <p className="text-sm text-gray-500 max-w-xl">{usuario.bio}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {usuario.precio_desde && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">desde {usuario.precio_desde}€</span>
            )}
            {usuario.anios_experiencia && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{usuario.anios_experiencia} años exp.</span>
            )}
            {usuario.instagram && (
              <a href={`https://instagram.com/${usuario.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                <span className="flex items-center gap-1"><Instagram size={11} /> {usuario.instagram}</span>
              </a>
            )}
            {usuario.web && (
              <a href={usuario.web.startsWith('http') ? usuario.web : `https://${usuario.web}`} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                <span className="flex items-center gap-1"><Globe size={11} /> {usuario.web.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        </div>

        {/* Professional slots */}
        {(usuario.tipo_cuenta === 'tatuador' || usuario.tipo_cuenta === 'estudio') &&
         (usuario.slot_sobre_mi || usuario.slot_estilo || usuario.slot_agendar) && (
          <div className="mb-6 space-y-3">
            {usuario.slot_sobre_mi && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Sobre mí</p>
                <p className="text-sm text-gray-700">{usuario.slot_sobre_mi}</p>
              </div>
            )}
            {usuario.slot_estilo && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Mi estilo</p>
                <p className="text-sm text-gray-700">{usuario.slot_estilo}</p>
              </div>
            )}
            {usuario.slot_agendar && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Cómo agendar</p>
                <p className="text-sm text-gray-700">{usuario.slot_agendar}</p>
              </div>
            )}
          </div>
        )}

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
          tipoCuenta={usuario.tipo_cuenta}
        />
      </div>
    </div>
  )
}
