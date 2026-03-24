'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import GaleriaGrid from './GaleriaGrid'
import type { Tattoo } from '@/lib/data'
import type { Carpeta } from '@/lib/queries'

type Props = {
  fotos: Tattoo[]
  guardadas: Tattoo[]
  carpetas: Carpeta[]
}

export default function PerfilTabs({ fotos, guardadas, carpetas }: Props) {
  const [tab, setTab] = useState<'creados' | 'guardados'>('creados')

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        <button
          onClick={() => setTab('creados')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'creados'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Creados ({fotos.length})
        </button>
        <button
          onClick={() => setTab('guardados')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'guardados'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Guardados ({guardadas.length})
        </button>
      </div>

      {tab === 'creados' && (
        fotos.length > 0 ? (
          <GaleriaGrid tattoos={fotos} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base">Aún no hay fotos publicadas</p>
          </div>
        )
      )}

      {tab === 'guardados' && (
        <div>
          {/* Board mosaics */}
          {carpetas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Tableros</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {carpetas.map(carpeta => (
                  <Link
                    key={carpeta.id}
                    href={`/tablero/${carpeta.id}`}
                    className="group block"
                  >
                    <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden mb-2 relative">
                      {/* Preview thumbnails in 2x2 grid */}
                      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                        {[0, 1, 2, 3].map(i => {
                          const photo = guardadas[i]
                          return (
                            <div key={i} className="relative overflow-hidden bg-gray-200">
                              {photo && (
                                <Image
                                  src={photo.url}
                                  alt=""
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  sizes="10vw"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{carpeta.nombre}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All saved */}
          {guardadas.length > 0 ? (
            <div>
              {carpetas.length > 0 && (
                <h3 className="text-sm font-medium text-gray-500 mb-4">Todos los guardados</h3>
              )}
              <GaleriaGrid tattoos={guardadas} />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-base">Aún no hay fotos guardadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
