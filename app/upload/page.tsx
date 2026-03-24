'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

type Estado = 'idle' | 'analizando' | 'ok' | 'pendiente' | 'revision' | 'error'

type Resultado = {
  id?: string
  url?: string
  tags?: string[]
  motivo?: string
  zona?: string
  tamaño?: string
  confidence?: number
  mensaje?: string
  error?: string
}

export default function UploadPage() {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setArchivo(f)
    setPreview(URL.createObjectURL(f))
    setEstado('idle')
    setResultado(null)
  }

  const handleSubir = async () => {
    if (!archivo) return
    if (!user) { openAuthModal(); return }

    setEstado('analizando')
    const fd = new FormData()
    fd.append('file', archivo)
    fd.append('titulo', titulo)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setEstado('error')
        setResultado({ error: json.error ?? 'Error desconocido' })
        return
      }

      const s: Estado =
        json.status === 'published' ? 'ok' :
        json.status === 'pending' ? 'pendiente' : 'revision'

      setEstado(s)
      setResultado(json)
    } catch {
      setEstado('error')
      setResultado({ error: 'Error de red' })
    }
  }

  const badgeColor: Record<Estado, string> = {
    ok: 'bg-green-50 text-green-700 border-green-100',
    pendiente: 'bg-amber-50 text-amber-700 border-amber-100',
    revision: 'bg-orange-50 text-orange-700 border-orange-100',
    error: 'bg-red-50 text-red-700 border-red-100',
    idle: '',
    analizando: '',
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <ImagePlus size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Subir foto</h1>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para subir tus fotos</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Subir foto</h1>
        <p className="text-sm text-gray-400">La IA analizará y etiquetará tu tatuaje automáticamente</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-colors mb-4 ${
          preview ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-2xl object-contain" />
            <label className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Cambiar imagen
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <ImagePlus size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Arrastra una foto o haz clic</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · Máx. 10 MB</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        )}
      </div>

      {archivo && estado === 'idle' && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Título (opcional)"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button
            onClick={handleSubir}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            Analizar con IA y subir
          </button>
        </div>
      )}

      {estado === 'analizando' && (
        <div className="flex items-center justify-center gap-2 py-4 text-gray-500 text-sm">
          <Loader2 size={18} className="animate-spin" />
          Analizando imagen con IA...
        </div>
      )}

      {resultado && estado !== 'idle' && estado !== 'analizando' && (
        <div className={`rounded-2xl border p-5 ${badgeColor[estado]}`}>
          <div className="flex items-center gap-2 mb-3">
            {estado === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <p className="font-medium text-sm">{resultado.error ?? resultado.mensaje}</p>
            {resultado.confidence && (
              <span className="ml-auto text-xs font-mono">
                {(resultado.confidence * 100).toFixed(0)}% confianza
              </span>
            )}
          </div>
          {resultado.tags && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {resultado.tags.map(t => (
                <span key={t} className="text-xs bg-white/60 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
          {resultado.motivo && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div><span className="opacity-60">Motivo:</span> <strong>{resultado.motivo}</strong></div>
              <div><span className="opacity-60">Zona:</span> <strong>{resultado.zona}</strong></div>
              <div><span className="opacity-60">Tamaño:</span> <strong>{resultado.tamaño}</strong></div>
            </div>
          )}
          {estado === 'ok' && resultado.id && (
            <button
              onClick={() => router.push(`/tattoo/${resultado.id}`)}
              className="mt-4 text-sm font-medium underline underline-offset-2"
            >
              Ver foto publicada →
            </button>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
        <p className="text-xs font-medium text-gray-500 mb-2">Niveles de confianza IA</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            ≥ 85% → Publicación automática
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            60–84% → Pendiente de revisión
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            &lt; 60% → Revisión manual
          </div>
        </div>
      </div>
    </div>
  )
}
