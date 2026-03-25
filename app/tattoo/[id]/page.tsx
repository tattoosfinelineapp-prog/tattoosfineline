import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPhotoById, getSimilarPhotos, getUserById } from '@/lib/queries'
import TattooCardSimple from '@/components/TattooCardSimple'
import TattooActions from '@/components/TattooActions'
import { ArrowLeft, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TattooPage({ params }: { params: { id: string } }) {
  const tattoo = await getPhotoById(params.id)
  if (!tattoo) notFound()

  const [similares, tatuador] = await Promise.all([
    getSimilarPhotos(tattoo.motivo, tattoo.id, 12),
    tattoo.tatuador_id ? getUserById(tattoo.tatuador_id) : Promise.resolve(null),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a la galería
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="rounded-3xl overflow-hidden shadow-sm bg-gray-50">
          <Image
            src={tattoo.url}
            alt={tattoo.alt_text || tattoo.title}
            width={600}
            height={tattoo.height || 600}
            className="w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium capitalize">
                {tattoo.motivo}
              </span>
              <TattooActions tattoo={tattoo} />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{tattoo.title}</h1>
            {tattoo.alt_text && (
              <p className="text-sm text-gray-400 mb-6">{tattoo.alt_text}</p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Zona', value: tattoo.zona },
                { label: 'Tamaño', value: tattoo.tamaño },
                { label: 'Likes', value: tattoo.likes.toLocaleString() },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            {tattoo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tattoo.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {tatuador && (
            <Link href={`/perfil/${tatuador.username ?? tatuador.id}`}>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {tatuador.avatar ? (
                    <Image src={tatuador.avatar} alt={tatuador.nombre ?? ''} width={48} height={48} className="object-cover" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{tatuador.nombre ?? tatuador.email}</p>
                  {tatuador.instagram && (
                    <p className="text-xs text-gray-400">{tatuador.instagram}</p>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {similares.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Más como esto</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {similares.map(t => (
              <TattooCardSimple key={t.id} tattoo={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
