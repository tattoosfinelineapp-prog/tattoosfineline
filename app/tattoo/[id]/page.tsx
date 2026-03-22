import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { tattoosSample, tatuadoresSample } from '@/lib/data'
import { Heart, Bookmark, Share2, ArrowLeft, User } from 'lucide-react'

export default function TattooPage({ params }: { params: { id: string } }) {
  const tattoo = tattoosSample.find(t => t.id === params.id)
  if (!tattoo) notFound()

  const tatuador = tatuadoresSample.find(t => t.id === tattoo.tatuador_id)
  const relacionados = tattoosSample.filter(t => t.id !== tattoo.id && t.motivo === tattoo.motivo).slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={16} />
        Volver a la galería
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="rounded-3xl overflow-hidden shadow-sm bg-gray-50">
          <Image
            src={tattoo.url}
            alt={tattoo.alt_text}
            width={600}
            height={tattoo.height}
            className="w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
                {tattoo.motivo}
              </span>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                  <Share2 size={16} />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                  <Bookmark size={16} />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
                  <Heart size={16} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{tattoo.title}</h1>
            <p className="text-sm text-gray-400 mb-6">{tattoo.alt_text}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Zona', value: tattoo.zona },
                { label: 'Tamaño', value: tattoo.tamaño },
                { label: 'Likes', value: tattoo.likes.toLocaleString() },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {tattoo.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {tatuador && (
            <Link href={`/perfil/${tatuador.id}`}>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={tatuador.avatar}
                    alt={tatuador.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{tatuador.nombre}</p>
                  <p className="text-xs text-gray-400">{tatuador.especialidad} · {tatuador.ciudad}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tatuajes similares</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relacionados.map(t => (
              <Link key={t.id} href={`/tattoo/${t.id}`}>
                <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Image
                    src={t.url}
                    alt={t.alt_text}
                    width={300}
                    height={t.height}
                    className="w-full object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
