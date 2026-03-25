'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, ChevronRight, Check, FolderPlus } from 'lucide-react'

type Step = 'nombre' | 'tags' | 'done'

type Props = {
  onClose: () => void
  onCreated: (carpeta: { id: string; nombre: string; tags_default: string[] }) => void
}

const SUGERENCIAS_NOMBRES = [
  'Palabras y frases', 'Florales', 'Animales', 'Minimalista',
  'Geométrico', 'Costillas', 'Luna y estrellas', 'Micro tattoos',
  'Lo mejor del mes', 'Acuarela', 'Brazo', 'Espalda',
]

const TAGS_POR_CATEGORIA: Record<string, string[]> = {
  'Estilo':  ['fine line', 'microrealismo', 'minimalista', 'acuarela', 'blackwork'],
  'Zona':    ['brazo', 'antebrazo', 'muñeca', 'costillas', 'espalda', 'tobillo', 'cuello', 'oreja'],
  'Motivo':  ['letras', 'flores', 'animales', 'luna', 'geometría', 'retratos', 'naturaleza'],
}

export default function CarpetaCreateModal({ onClose, onCreated }: Props) {
  const supabase = createClientComponentClient()
  const [step, setStep] = useState<Step>('nombre')
  const [nombre, setNombre] = useState('')
  const [tagsDefault, setTagsDefault] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleTag = (tag: string) => {
    setTagsDefault(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tagsDefault.includes(t)) {
      setTagsDefault(prev => [...prev, t])
    }
    setTagInput('')
  }

  const handleCreate = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const { data } = await supabase
      .from('carpetas')
      .insert({
        user_id: session.user.id,
        nombre: nombre.trim(),
        tags_default: tagsDefault,
      })
      .select('id, nombre, tags_default')
      .single()

    setSaving(false)
    if (data) {
      setStep('done')
      onCreated({ id: data.id, nombre: data.nombre, tags_default: data.tags_default ?? [] })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              {step === 'nombre' ? 'Nueva carpeta' : step === 'tags' ? 'Tags por defecto' : '¡Lista!'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── PASO 1: Nombre ─────────────────── */}
        {step === 'nombre' && (
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">¿Cómo se llama esta carpeta?</p>

            <input
              type="text"
              placeholder="Ej: Florales, Micro tattoos, Brazo..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nombre.trim() && setStep('tags')}
              autoFocus
              maxLength={50}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all mb-4"
            />

            <div className="flex flex-wrap gap-2 mb-6">
              {SUGERENCIAS_NOMBRES.map(s => (
                <button
                  key={s}
                  onClick={() => setNombre(s)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    nombre === s
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('tags')}
              disabled={!nombre.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── PASO 2: Tags por defecto ────────── */}
        {step === 'tags' && (
          <div className="p-6">
            <div className="bg-blue-50 rounded-2xl p-3 mb-5 text-xs text-blue-700 leading-relaxed">
              💡 Estos tags se añaden automáticamente a <strong>todas las fotos</strong> de esta carpeta. Ahorra tiempo, no tendrás que etiquetar cada foto.
            </div>

            <div className="space-y-4 mb-5">
              {Object.entries(TAGS_POR_CATEGORIA).map(([categoria, tags]) => (
                <div key={categoria}>
                  <p className="text-xs font-medium text-gray-500 mb-2">{categoria}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                          tagsDefault.includes(tag)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {tagsDefault.includes(tag) ? <Check size={10} className="inline mr-1" /> : null}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="Añadir tag propio..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 border border-gray-200"
              />
              <button
                onClick={addCustomTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Añadir
              </button>
            </div>

            {tagsDefault.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5 p-3 bg-gray-50 rounded-xl">
                {tagsDefault.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-full">
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="hover:opacity-70">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear carpeta'}
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sin tags
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Confirmación ─────────────── */}
        {step === 'done' && (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              &ldquo;{nombre}&rdquo; está lista
            </h3>
            {tagsDefault.length > 0 && (
              <p className="text-sm text-gray-400 mb-6">
                {tagsDefault.length} tag{tagsDefault.length !== 1 ? 's' : ''} se aplicarán automáticamente a tus fotos
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
              >
                Subir fotos ahora
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hacerlo después
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
