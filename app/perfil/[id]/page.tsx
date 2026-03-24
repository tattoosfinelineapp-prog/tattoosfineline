import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getUserById, getPhotosByTatuador, getSavedPhotos } from '@/lib/queries'
import GaleriaGrid from '@/components/GaleriaGrid'
import { Instagram, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PerfilPage({ params }: { params: { id: string } }) {
  const usuario = await getUserById(params.id)
  if (!usuario) notFound()

  const [fotos, guardadas] = await Promise.all([
    getPhotosByTatuador(params.id),
    getSavedPhotos(params.id),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {usuario.avatar ? (
            <Image src={usuario.avatar} alt={usuario.nombre ?? ''} width={80} height={80} className="object-cover" />
          ) : (
            <span className="text-3xl font-semibold text-gray-400">
              {(usuario.nombre ?? usuario.email)[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {usuario.nombre ?? usuario.email.split('@')[0]}
          </h1>
          {usuario.bio && (
            <p className="text-sm text-gray-400 mb-3 max-w-xl">{usuario.bio}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {usuario.instagram && (
              <span className="flex items-center gap-1">
                <Instagram size={14} />
                {usuario.instagram}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{fotos.length}</p>
            <p className="text-xs text-gray-400">publicados</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{guardadas.length}</p>
            <p className="text-xs text-gray-400">guardados</p>
          </div>
        </div>
      </div>

      {fotos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publicados</h2>
          <GaleriaGrid tattoos={fotos} />
        </div>
      )}

      {guardadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardados</h2>
          <GaleriaGrid tattoos={guardadas} />
        </div>
      )}

      {fotos.length === 0 && guardadas.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aún no hay fotos</p>
        </div>
      )}
    </div>
  )
}
