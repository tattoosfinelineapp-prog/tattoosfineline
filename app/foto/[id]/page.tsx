import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPhotoById, getUserById } from '@/lib/queries'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tattoo = await getPhotoById(params.id)
  if (!tattoo) return { title: 'Foto no encontrada' }

  const tatuador = tattoo.tatuador_id ? await getUserById(tattoo.tatuador_id) : null
  const tags = tattoo.tags.join(', ')
  const ciudad = tatuador?.ciudad ?? ''
  const autor = tatuador?.nombre ?? tattoo.tatuador
  const title = `${tags || 'Fine line tattoo'} · tattoosfineline`
  const desc = `Tatuaje de ${tags}${tattoo.zona ? ` en ${tattoo.zona}` : ''} por ${autor}${ciudad ? ` en ${ciudad}` : ''}`

  return {
    title,
    description: desc,
    keywords: [...tattoo.tags, 'fine line', 'tatuaje', ciudad].filter(Boolean).join(', '),
    openGraph: {
      title,
      description: desc,
      images: [{ url: tattoo.url, width: 400, height: tattoo.height || 400 }],
      type: 'article',
      siteName: 'tattoosfineline',
      url: `https://tattoosfineline.com/foto/${params.id}`,
    },
    twitter: { card: 'summary_large_image', title, images: [tattoo.url] },
    other: {
      'schema:type': 'ImageObject',
    },
  }
}

export default async function FotoPage({ params }: Props) {
  const tattoo = await getPhotoById(params.id)
  if (!tattoo) notFound()

  const tatuador = tattoo.tatuador_id ? await getUserById(tattoo.tatuador_id) : null

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: tattoo.url,
    description: tattoo.alt_text || tattoo.tags.join(', '),
    name: tattoo.tags.join(', '),
    author: tatuador ? { '@type': 'Person', name: tatuador.nombre, url: `https://tattoosfineline.com/${tatuador.username ?? tatuador.id}` } : undefined,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

      <Link href="/galeria" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={16} /> Ver galería
      </Link>

      <div className="rounded-2xl overflow-hidden bg-gray-100 mb-6">
        <Image src={tattoo.url} alt={tattoo.alt_text || tattoo.tags.join(', ')} width={800} height={tattoo.height || 600} className="w-full h-auto" priority />
      </div>

      {tatuador && (
        <Link href={`/${tatuador.username ?? tatuador.id}`} className="flex items-center gap-3 mb-4 group">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            {tatuador.avatar
              ? <Image src={tatuador.avatar} alt="" width={40} height={40} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">{(tatuador.nombre ?? '?')[0].toUpperCase()}</div>
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:underline">{tatuador.nombre ?? tatuador.username}</p>
            {tatuador.ciudad && <p className="text-xs text-gray-400">{tatuador.ciudad}</p>}
          </div>
        </Link>
      )}

      {tattoo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tattoo.tags.map(tag => (
            <Link key={tag} href={`/galeria?q=${encodeURIComponent(tag)}`} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="text-center pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400 mb-3">Descubre más tatuajes fine line</p>
        <Link href="/galeria" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
          Ver más en tattoosfineline.com
        </Link>
      </div>
    </div>
  )
}
