import Image from 'next/image'
import Link from 'next/link'
import LandingSearch from '@/components/LandingSearch'
import AnimatedTagline from '@/components/AnimatedTagline'
import { getLandingPhotos, getPhotoCount, getLandingCarpetas, getTopTatuadores } from '@/lib/queries'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const POPULAR_TAGS_ES = ['floral', 'luna', 'mariposa', 'minimalista', 'letras', 'geométrico', 'animales', 'mandala']
const POPULAR_TAGS_EN = ['floral', 'moon', 'butterfly', 'minimalist', 'letters', 'geometric', 'animals', 'mandala']

export default async function Home() {
  const t = await getTranslations('Landing')

  const [bgPhotos, total, carpetasData, topTatuadores] = await Promise.all([
    getLandingPhotos(6),
    getPhotoCount(),
    getLandingCarpetas(4),
    getTopTatuadores(1),
  ])

  const featuredTatuador = topTatuadores[0] ?? null

  const countLabel = total > 0
    ? t('counter', { count: total.toLocaleString('es') })
    : t('counterFallback')

  // Detect locale to pick correct tag list
  const isEnglish = t('exploreGallery') === 'Explore gallery'
  const POPULAR_TAGS = isEnglish ? POPULAR_TAGS_EN : POPULAR_TAGS_ES

  return (
    <>
      {/* ── SECCIÓN 1: Hero ─────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-white">

        {/* Blurred masonry background — desktop only */}
        {bgPhotos.length > 0 && (
          <div className="absolute inset-0 columns-4 gap-1 pointer-events-none hidden sm:block" aria-hidden>
            {bgPhotos.map(p => (
              <div key={p.id} className="break-inside-avoid mb-1 overflow-hidden">
                <Image
                  src={p.url} alt=""
                  width={300} height={p.height || 350}
                  className="w-full h-auto block opacity-[0.15] blur-[2px]"
                  sizes="25vw" priority
                />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-b from-white/90 via-white/82 to-white/90 pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-gray-900 mb-4 leading-none">
            tattoos<span className="font-light">fineline</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 font-normal mb-2 h-8 leading-tight">
            <AnimatedTagline />
          </p>
          <p className="text-sm text-gray-400 mb-8">
            {t('subtitle')}
          </p>

          <LandingSearch />

          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR_TAGS.map(tag => (
              <Link
                key={tag}
                href={`/galeria?q=${encodeURIComponent(tag)}`}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm"
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
            >
              {t('exploreGallery')}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <p className="text-xs text-gray-400">{countLabel}</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: Encuentra tu tatuaje ─────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#FFF5F5' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-3">{t('section2Tag')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4 leading-tight">
              {t('section2Title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-gray-500 text-base mb-6 max-w-sm">
              {t('section2Body')}
            </p>
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              {t('viewGallery')}
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 max-w-xs md:max-w-none">
            {bgPhotos.slice(0, 6).map((p, i) => (
              <div key={p.id} className={`rounded-2xl overflow-hidden ${i === 1 ? 'mt-6' : i === 3 ? 'mt-4' : ''}`}>
                <Image src={p.url} alt="" width={120} height={p.height || 160} className="w-full h-auto block" sizes="120px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: Carpetas de inspiración ──────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#FFFFF0' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">{t('section3Tag')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4 leading-tight">
              {t('section3Title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-gray-500 text-base mb-6 max-w-sm">
              {t('section3Body')}
            </p>
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              {t('startFree')}
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 max-w-xs">
            {(carpetasData.length > 0
              ? carpetasData
              : [0, 1, 2, 3].map(i => ({
                  id: String(i),
                  nombre: isEnglish
                    ? ['Summer ideas', 'Right arm', 'Florals', 'Someday'][i]
                    : ['Ideas verano', 'Brazo derecho', 'Florales', 'Algún día'][i],
                  foto_count: 0,
                  cover_urls: bgPhotos.slice(i * 2, i * 2 + 4).map(p => p.url),
                }))
            ).map((carpeta, i) => (
              <Link
                key={carpeta.id}
                href={carpeta.foto_count > 0 ? `/tablero/${carpeta.id}` : '/galeria'}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-2 gap-1 mb-3 aspect-square rounded-xl overflow-hidden bg-gray-50">
                  {(carpeta.cover_urls.length > 0
                    ? carpeta.cover_urls
                    : bgPhotos.slice(i * 2, i * 2 + 4).map(p => p.url)
                  ).slice(0, 4).map((url, j) => (
                    <div key={j} className="relative overflow-hidden">
                      <Image src={url} alt="" fill className="object-cover" sizes="60px" />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-800 truncate">{carpeta.nombre}</p>
                {carpeta.foto_count > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{carpeta.foto_count} {isEnglish ? 'photos' : 'fotos'}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: Para tatuadores ───────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#F0FFF4' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">{t('section4Tag')}</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4 leading-tight">
              {t('section4Title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-gray-500 text-base mb-2 max-w-sm">
              {t('section4Body1')}
            </p>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              {t('section4Body2')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/?registro=tatuador"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {t('createProfile')}
              </Link>
              <Link
                href="/galeria"
                className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-colors"
              >
                {t('seeExamples')}
              </Link>
            </div>
          </div>
          <Link
            href={featuredTatuador ? `/${featuredTatuador.username ?? featuredTatuador.id}` : '/galeria'}
            className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 max-w-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {featuredTatuador?.avatar ? (
                  <Image src={featuredTatuador.avatar} alt="" width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">
                    {(featuredTatuador?.nombre ?? 'ST')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {featuredTatuador?.nombre_estudio ?? featuredTatuador?.nombre ?? 'Sinkply Tattoo'}
                </p>
                <p className="text-xs text-gray-400">
                  {t('fineLineOnly')}{featuredTatuador?.ciudad ? ` · ${featuredTatuador.ciudad}` : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {bgPhotos.slice(0, 6).map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <Image src={p.url} alt="" width={80} height={80} className="w-full h-full object-cover" sizes="80px" />
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-center pt-2 border-t border-gray-50">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{total > 0 ? total.toLocaleString('es') : '—'}</p>
                <p className="text-xs text-gray-400">{isEnglish ? 'photos' : 'fotos'}</p>
              </div>
              {featuredTatuador?.followers_count ? (
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{featuredTatuador.followers_count}</p>
                  <p className="text-xs text-gray-400">{isEnglish ? 'followers' : 'seguidores'}</p>
                </div>
              ) : null}
            </div>
          </Link>
        </div>
      </section>

      {/* ── SECCIÓN 5: CTA final ─────────────────────────── */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4 leading-tight">
            {t('section5Title').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h2>
          <p className="text-gray-400 mb-10 text-base">
            {t('section5Body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/?registro=true"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              {t('registerFree')}
            </Link>
            <Link
              href="/galeria"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 text-gray-300 rounded-2xl text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
            >
              {t('exploreNoAccount')}
            </Link>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            {t('alreadyHaveAccount')}{' '}
            <button className="text-gray-400 hover:text-white underline transition-colors">
              {t('signIn')}
            </button>
          </p>
        </div>
      </section>
    </>
  )
}
