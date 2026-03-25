'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle, X, ChevronRight, RotateCcw, FolderPlus } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import imageCompression from 'browser-image-compression'

type FileItem = {
  id: string
  file: File
  preview: string
  tamano: string
  zona: string
  motivo: string
  tags: string[]
  alt_text: string
  confidence: number
  analyzed: boolean
  analyzing: boolean
  analyzeError: string
  uploaded: boolean
  uploading: boolean
  uploadError: string
  resultId?: string
  tatuador_etiquetado_id?: string
  tatuador_etiquetado_nombre?: string
}

type Step = 'select' | 'analyze' | 'edit' | 'upload' | 'done'

const MAX_FILES = 40
const MAX_SIZE_MB = 10

function TipBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
      <FolderPlus size={18} className="text-gray-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">Sube más rápido con carpetas</p>
        <p className="text-xs text-gray-400 mt-0.5">Crea carpetas con tags predefinidos y se aplicarán a todas las fotos automáticamente</p>
        <a href="/perfil" className="text-xs text-gray-700 font-medium hover:underline mt-1 inline-block">Crear carpeta</a>
      </div>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-500 shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}

export default function UploadPage() {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [items, setItems] = useState<FileItem[]>([])
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [consent, setConsent] = useState(false)
  const [tagInput, setTagInput] = useState<Record<string, string>>({})
  const [tatSearch, setTatSearch] = useState<Record<string, string>>({})
  const [tatResults, setTatResults] = useState<Record<string, { id: string; nombre: string | null; username: string | null }[]>>({})
  const [showTip, setShowTip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('upload_tip_seen')) {
      setShowTip(true)
    }
  }, [])

  const closeTip = () => {
    setShowTip(false)
    localStorage.setItem('upload_tip_seen', 'true')
  }

  const makeItem = (file: File): FileItem | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return null
    return {
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      tamano: '', zona: '', motivo: '', tags: [], alt_text: '',
      confidence: 0, analyzed: false, analyzing: false, analyzeError: '',
      uploaded: false, uploading: false, uploadError: '',
    }
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES - items.length)
    const sizeErrors: string[] = []
    const newItems: FileItem[] = []
    for (const f of arr) {
      const item = makeItem(f)
      if (!item) sizeErrors.push(f.name)
      else newItems.push(item)
    }
    if (sizeErrors.length) alert(`Archivos demasiado grandes (máx ${MAX_SIZE_MB}MB):\n${sizeErrors.join('\n')}`)
    setItems(prev => [...prev, ...newItems])
  }, [items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const compressFile = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      })
    } catch {
      return file
    }
  }

  const updateItem = (id: string, patch: Partial<FileItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const removeTag = (id: string, tag: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, tags: it.tags.filter(t => t !== tag) } : it))

  const searchTatuadores = async (itemId: string, q: string) => {
    setTatSearch(prev => ({ ...prev, [itemId]: q }))
    if (!q.trim()) { setTatResults(prev => ({ ...prev, [itemId]: [] })); return }
    const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}&tipo=tatuador`)
    const json = await res.json()
    const all = [...(json.tatuadores ?? []), ...(json.estudios ?? [])]
    setTatResults(prev => ({ ...prev, [itemId]: all.slice(0, 5) }))
  }

  const selectTatuador = (itemId: string, tat: { id: string; nombre: string | null; username: string | null }) => {
    updateItem(itemId, { tatuador_etiquetado_id: tat.id, tatuador_etiquetado_nombre: tat.nombre ?? tat.username ?? 'Tatuador' })
    setTatSearch(prev => ({ ...prev, [itemId]: '' }))
    setTatResults(prev => ({ ...prev, [itemId]: [] }))
  }

  const addTag = (id: string, tag: string) => {
    const t = tag.trim().toLowerCase()
    if (!t) return
    setItems(prev => prev.map(it =>
      it.id === id && !it.tags.includes(t) ? { ...it, tags: [...it.tags, t] } : it
    ))
    setTagInput(prev => ({ ...prev, [id]: '' }))
  }

  const analyzeAll = async () => {
    setStep('analyze')
    setAnalyzeProgress(0)
    const toAnalyze = items.filter(it => !it.analyzed)
    let done = 0

    await Promise.all(
      toAnalyze.map(async (item) => {
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, analyzing: true } : it))
        try {
          const compressed = await compressFile(item.file)
          const fd = new FormData()
          fd.append('file', compressed)
          const res = await fetch('/api/analyze', { method: 'POST', body: fd })
          const json = await res.json()
          setItems(prev => prev.map(it =>
            it.id === item.id
              ? {
                  ...it,
                  analyzing: false,
                  analyzed: true,
                  tags: json.tags ?? [],
                  zona: json.zona ?? '',
                  tamano: json.tamano ?? '',
                  motivo: json.motivo ?? '',
                  alt_text: json.alt_text ?? '',
                  confidence: json.confidence ?? 0.5,
                  analyzeError: json.error ?? '',
                }
              : it
          ))
        } catch {
          setItems(prev => prev.map(it =>
            it.id === item.id ? { ...it, analyzing: false, analyzed: true, analyzeError: 'Error de red' } : it
          ))
        }
        done++
        setAnalyzeProgress(Math.round((done / toAnalyze.length) * 100))
      })
    )
    setStep('edit')
  }

  const uploadSingle = async (item: FileItem): Promise<void> => {
    updateItem(item.id, { uploading: true, uploadError: '' })
    try {
      const compressed = await compressFile(item.file)
      const fd = new FormData()
      fd.append('file', compressed)
      fd.append('zona', item.zona)
      fd.append('tamano', item.tamano)   // no ñ in field name
      fd.append('motivo', item.motivo)
      fd.append('tags', JSON.stringify(item.tags))
      fd.append('alt_text', item.alt_text)
      fd.append('confidence', String(item.confidence))
      if (item.tatuador_etiquetado_id) fd.append('tatuador_etiquetado_id', item.tatuador_etiquetado_id)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        console.error('[upload]', res.status, json)
        updateItem(item.id, { uploading: false, uploadError: json.error ?? `Error ${res.status}` })
      } else {
        updateItem(item.id, { uploading: false, uploaded: true, uploadError: '', resultId: json.id })
      }
    } catch (e) {
      console.error('[upload] network error:', e)
      updateItem(item.id, { uploading: false, uploadError: 'Error de red' })
    }
  }

  const uploadAll = async () => {
    setStep('upload')
    setUploadProgress(0)
    const toUpload = items.filter(it => !it.uploaded)
    let done = 0
    for (const item of toUpload) {
      await uploadSingle(item)
      done++
      setUploadProgress(Math.round((done / toUpload.length) * 100))
    }
    setStep('done')
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ImagePlus size={40} className="mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Subir fotos</h1>
        <p className="text-sm text-gray-400 mb-6">Inicia sesión para subir tus fotos</p>
        <button onClick={() => openAuthModal('login')} className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
          Iniciar sesión
        </button>
      </div>
    )
  }

  // ── STEP: SELECT ─────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {showTip && <TipBanner onClose={closeTip} />}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Subir fotos</h1>
          <p className="text-sm text-gray-400 mt-1">Hasta {MAX_FILES} fotos · JPG, PNG, WEBP · Máx. {MAX_SIZE_MB}MB c/u</p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-colors mb-6 ${
            dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <ImagePlus size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700">Arrastra fotos aquí o haz clic</p>
          <p className="text-xs text-gray-400 mt-1">Selecciona hasta {MAX_FILES} imágenes</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-6">
              {items.map(item => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={e => { e.stopPropagation(); setItems(prev => prev.filter(it => it.id !== item.id)) }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {items.length < MAX_FILES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
                >
                  <ImagePlus size={18} className="text-gray-300" />
                </button>
              )}
            </div>

            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer mb-4 border border-gray-100 hover:border-gray-200 transition-colors">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-gray-900 cursor-pointer shrink-0"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Confirmo que tengo permiso para publicar estas imágenes y que{' '}
                <span className="font-medium text-gray-800">no contienen caras identificables sin consentimiento</span>.
              </span>
            </label>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{items.length} foto{items.length !== 1 ? 's' : ''}</p>
              <button
                onClick={analyzeAll}
                disabled={!consent}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analizar con IA
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── STEP: ANALYZE ─────────────────────────────────────────────
  if (step === 'analyze') {
    const analyzed = items.filter(it => it.analyzed).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Loader2 size={32} className="mx-auto mb-4 text-gray-400 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Analizando con IA...</h2>
        <p className="text-sm text-gray-400 mb-6">{analyzed} / {items.length}</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${analyzeProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP: EDIT ─────────────────────────────────────────────
  if (step === 'edit') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revisar tags</h2>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} foto{items.length !== 1 ? 's' : ''} analizadas — toca los tags para editar</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-4 bg-white">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <img src={item.preview} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0" />

                {/* Tags */}
                <div className="flex-1 min-w-0">
                  {/* Tag chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors"
                        onClick={() => removeTag(item.id, tag)}
                        title="Toca para quitar"
                      >
                        {tag}
                        <X size={9} />
                      </span>
                    ))}

                    {/* Inline add tag */}
                    <div className="flex items-center gap-1 border border-dashed border-gray-200 rounded-full px-2 py-1">
                      <span className="text-gray-300 text-xs">+</span>
                      <input
                        type="text"
                        value={tagInput[item.id] ?? ''}
                        onChange={e => setTagInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addTag(item.id, tagInput[item.id] ?? '')
                          }
                        }}
                        placeholder="añadir tag"
                        className="text-xs text-gray-600 bg-transparent outline-none w-20 placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {item.analyzeError && (
                    <p className="text-xs text-amber-500 mt-2">Análisis incompleto — añade tags manualmente</p>
                  )}

                  {/* Tag tatuador */}
                  <div className="mt-3 relative">
                    {item.tatuador_etiquetado_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Tatuado por:</span>
                        <span className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          {item.tatuador_etiquetado_nombre}
                          <button onClick={() => updateItem(item.id, { tatuador_etiquetado_id: undefined, tatuador_etiquetado_nombre: undefined })}>
                            <X size={9} />
                          </button>
                        </span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={tatSearch[item.id] ?? ''}
                          onChange={e => searchTatuadores(item.id, e.target.value)}
                          placeholder="¿Quién te hizo este tatuaje? (opcional)"
                          className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-300"
                        />
                        {(tatResults[item.id] ?? []).length > 0 && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            {(tatResults[item.id] ?? []).map(t => (
                              <button
                                key={t.id}
                                onMouseDown={() => selectTatuador(item.id, t)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {t.nombre ?? t.username}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={uploadAll}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
            >
              <Upload size={16} />
              Publicar {items.length} foto{items.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: UPLOADING ─────────────────────────────────────────────
  if (step === 'upload') {
    const uploaded = items.filter(it => it.uploaded).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Upload size={32} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subiendo...</h2>
        <p className="text-sm text-gray-400 mb-6">{uploaded} / {items.length}</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP: DONE ─────────────────────────────────────────────────
  const ok     = items.filter(it => it.uploaded)
  const failed = items.filter(it => it.uploadError && !it.uploaded)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          {ok.length} foto{ok.length !== 1 ? 's' : ''} publicada{ok.length !== 1 ? 's' : ''}
        </h2>
        {failed.length > 0 && (
          <p className="text-sm text-red-500">
            {failed.length} fallaron — usa el botón Reintentar en cada una
          </p>
        )}
      </div>

      {/* Failed photos with retry */}
      {failed.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-3">Fotos con error:</p>
          {failed.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 border border-red-100 rounded-2xl bg-red-50">
              <img src={item.preview} alt="" className="w-14 h-14 object-cover rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.tags.join(', ') || item.file.name}</p>
                <p className="text-xs text-red-500 truncate">{item.uploadError}</p>
              </div>
              <button
                onClick={() => uploadSingle(item)}
                disabled={item.uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
              >
                {item.uploading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <RotateCcw size={13} />
                }
                Reintentar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* OK thumbnails */}
      {ok.length > 0 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-8">
          {ok.map(item => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={item.preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={16} className="text-green-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setItems([]); setStep('select') }}
          className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-200 transition-colors"
        >
          Subir más
        </button>
        <button
          onClick={() => router.push('/galeria')}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
        >
          Ver galería
        </button>
      </div>
    </div>
  )
}
