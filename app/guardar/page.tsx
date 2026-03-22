'use client'

import { Bookmark, FolderOpen, Lock } from 'lucide-react'

const carpetasEjemplo = [
  { id: '1', nombre: 'Mis favoritas', cantidad: 12, privada: false },
  { id: '2', nombre: 'Ideas para el brazo', cantidad: 8, privada: true },
  { id: '3', nombre: 'Florales', cantidad: 5, privada: false },
]

export default function GuardarPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Guardados</h1>
          <p className="text-sm text-gray-400 mt-1">Tus colecciones privadas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
          <FolderOpen size={16} />
          Nueva carpeta
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 text-sm text-amber-700">
        Inicia sesión para guardar y sincronizar tus colecciones
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {carpetasEjemplo.map(c => (
          <div
            key={c.id}
            className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Bookmark size={18} className="text-gray-600" />
              </div>
              {c.privada && <Lock size={14} className="text-gray-300" />}
            </div>
            <p className="font-medium text-gray-900 text-sm">{c.nombre}</p>
            <p className="text-xs text-gray-400 mt-1">{c.cantidad} tatuajes</p>
          </div>
        ))}
      </div>
    </div>
  )
}
