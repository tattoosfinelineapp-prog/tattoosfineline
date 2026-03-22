import Image from 'next/image'
import { notFound } from 'next/navigation'
import { tatuadoresSample } from '@/lib/data'
import GaleriaGrid from '@/components/GaleriaGrid'
import { Instagram, MapPin } from 'lucide-react'

export default function PerfilPage({ params }: { params: { id: string } }) {
  const tatuador = tatuadoresSample.find(t => t.id === params.id)
  if (!tatuador) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={tatuador.avatar}
            alt={tatuador.nombre}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">{tatuador.nombre}</h1>
          <p className="text-sm text-gray-400 mb-3">{tatuador.especialidad}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {tatuador.ciudad}
            </span>
            <span className="flex items-center gap-1">
              <Instagram size={14} />
              {tatuador.instagram}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{tatuador.tattoos.length}</p>
            <p className="text-xs text-gray-400">fotos</p>
          </div>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-8 max-w-xl">{tatuador.bio}</p>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Trabajos</h2>
      <GaleriaGrid tattoos={tatuador.tattoos} />
    </div>
  )
}
