import Image from 'next/image'
import Link from 'next/link'
import LandingSearch from '@/components/LandingSearch'
import { getLandingPhotos, getPhotoCount } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const POPULAR_TAGS = [
  'floral', 'luna', 'mariposa', 'minimalista',
  'letras', 'geométrico', 'animales',
]

export default async function Home() {
  const [bgPhotos, total] = await Promise.all([
    getLandingPhotos(16),
    getPhotoCount(),
  ])

  const countLabel = total > 0
    ? `+${total.toLocaleString('es')} tatuajes y creciendo`
    : 'Miles de tatuajes fine line'

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-white">

      {/* Blurred masonry background */}
      {bgPhotos.length > 0 && (
        <div
          className="absolute inset-0 columns-4 gap-1 pointer-events-none"
          aria-hidden
        >
          {bgPhotos.map(p => (
            <div key={p.id} className="break-inside-avoid mb-1 relative overflow-hidden">
              <Image
                src={p.url}
                alt=""
                width={300}
                height={p.height || 350}
                className="w-full h-auto block opacity-30 blur-[3px] scale-105"
                sizes="25vw"
                priority
              />
            </div>
          ))}
        </div>
      )}

      {/* White overlay — stronger center, transparent edges let photos peek */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/75 to-white/80 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-6 text-center">

        {/* Logo */}
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-gray-900 mb-2 leading-none">
          tattoos<span className="font-light">fineline</span>
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-lg text-gray-600 font-normal mb-1 mt-3">
          Tu inspiración fine line, actualizada cada día
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Miles de tattoos inspo para encontrar tu próximo tatuaje perfecto
        </p>

        {/* Search */}
        <LandingSearch />

        {/* Popular tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {POPULAR_TAGS.map(tag => (
            <Link
              key={tag}
              href={`/galeria?q=${encodeURIComponent(tag)}`}
              className="px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm hover:shadow"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* CTA + count */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/galeria"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg"
          >
            Explorar galería
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-xs text-gray-400">{countLabel}</p>
        </div>
      </div>
    </div>
  )
}
