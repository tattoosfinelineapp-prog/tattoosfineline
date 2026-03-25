'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, CheckCircle, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import imageCompression from 'browser-image-compression'

type FileItem = {
  id: string
  file: File
  preview: string
  tags: string[]
  zona: string
  motivo: string
  alt_text: string
  es_tatuaje: boolean
  confidence: number
  analyzed: boolean
  analyzing: boolean
  analyzeError: string
  uploaded: boolean
  uploading: boolean
  uploadError: string
}

type Step = 'select' | 'analyze' | 'review' | 'upload' | 'done'

const MAX_FILES = 20
const MAX_SIZE_MB = 10

export default function UploadPage() {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [items, setItems] = useState<FileItem[]>([])
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const makeItem = (file: File): FileItem | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return null
    return {
      id: `${Date.now()}-${Math.random()}`,
      file, preview: URL.createObjectURL(file),
      tags: [], zona: '', motivo: '', alt_text: '', es_tatuaje: true,
      confidence: 0, analyzed: false, analyzing: false, analyzeError: '',
      uploaded: false, uploading: false, uploadError: '',
    }
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES - items.length)
    const newItems: FileItem[] = []
    for (const f of arr) {
      const item = makeItem(f)
      if (item) newItems.push(item)
    }
    setItems(prev => [...prev, ...newItems])
  }, [items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const compressFile = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true,
        fileType: 'image/webp', initialQuality: 0.85,
      })
    } catch { return file }
  }

  // ── STEP 2: Analyze all with AI ──
  const analyzeAll = async () => {
    setStep('analyze')
    setAnalyzeProgress(0)
    let done = 0

    for (let i = 0; i < items.length; i += 3) {
      const batch = items.slice(i, i + 3)
      await Promise.all(batch.map(async (item) => {
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, analyzing: true } : it))
        try {
          const compressed = await compressFile(item.file)
          const fd = new FormData()
          fd.append('file', compressed)
          const res = await fetch('/api/analyze', { method: 'POST', body: fd })
          const json = await res.json()
          setItems(prev => prev.map(it =>
            it.id === item.id ? {
              ...it, analyzing: false, analyzed: true,
              tags: json.tags ?? [], zona: json.zona ?? '', motivo: json.motivo ?? '',
              alt_text: json.alt_text ?? '', es_tatuaje: json.es_tatuaje ?? true,
              confidence: json.confidence ?? 0.5, analyzeError: json.error ?? '',
            } : it
          ))
        } catch {
          setItems(prev => prev.map(it =>
            it.id === item.id ? { ...it, analyzing: false, analyzed: true, analyzeError: 'Error de red' } : it
          ))
        }
        done++
        setAnalyzeProgress(Math.round((done / items.length) * 100))
      }))
    }
    setReviewIndex(0)
    setStep('review')
  }

  // ── STEP 4: Upload all ──
  const uploadAll = async () => {
    setStep('upload')
    setUploadProgress(0)
    const toUpload = items.filter(it => it.es_tatuaje && !it.uploaded)
    let done = 0
    for (const item of toUpload) {
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, uploading: true } : it))
      try {
        const compressed = await compressFile(item.file)
        const fd = new FormData()
        fd.append('file', compressed)
        fd.append('zona', item.zona)
        fd.append('motivo', item.motivo)
        fd.append('tamano', '')
        fd.append('tags', JSON.stringify(item.tags))
        fd.append('alt_text', item.alt_text)
        fd.append('confidence', String(item.confidence))
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          setItems(prev => prev.map(it => it.id === item.id ? { ...it, uploading: false, uploadError: json.error ?? 'Error' } : it))
        } else {
          setItems(prev => prev.map(it => it.id === item.id ? { ...it, uploading: false, uploaded: true } : it))
        }
      } catch {
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, uploading: false, uploadError: 'Error de red' } : it))
      }
      done++
      setUploadProgress(Math.round((done / toUpload.length) * 100))
    }
    setStep('done')
  }

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (!t) return
    const item = items[reviewIndex]
    if (item && !item.tags.includes(t)) {
      setItems(prev => prev.map((it, i) => i === reviewIndex ? { ...it, tags: [...it.tags, t] } : it))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setItems(prev => prev.map((it, i) =>
      i === reviewIndex ? { ...it, tags: it.tags.filter(t => t !== tag) } : it
    ))
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

  // ── STEP 1: SELECT ──
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Subir fotos</h1>
          <p className="text-sm text-gray-400 mt-1">Hasta {MAX_FILES} fotos · JPG, PNG, WEBP · Máx {MAX_SIZE_MB}MB</p>
        </div>

        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
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
            ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
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
                    onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {items.length < MAX_FILES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300"
                >
                  <ImagePlus size={18} className="text-gray-300" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{items.length} foto{items.length !== 1 ? 's' : ''}</p>
              <button
                onClick={analyzeAll}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
              >
                Analizar con IA
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── STEP 2: ANALYZING ──
  if (step === 'analyze') {
    const analyzed = items.filter(it => it.analyzed).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Loader2 size={32} className="mx-auto mb-4 text-gray-400 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Analizando {items.length} fotos...</h2>
        <p className="text-sm text-gray-400 mb-6">{analyzed} / {items.length}</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${analyzeProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP 3: REVIEW (one photo at a time) ──
  if (step === 'review') {
    const current = items[reviewIndex]
    if (!current) { setStep('select'); return null }
    const total = items.length

    return (
      <div className="max-w-lg mx-auto px-4 py-8 pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">Foto {reviewIndex + 1} de {total}</p>
          <button
            onClick={uploadAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Upload size={14} />
            Publicar todas
          </button>
        </div>

        {/* Photo */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 mb-6">
          <img src={current.preview} alt="" className="w-full h-auto max-h-[50vh] object-contain" />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tags sugeridos</p>
          <div className="flex flex-wrap gap-1.5">
            {current.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X size={11} />
              </span>
            ))}

            <div className="flex items-center gap-1 border border-dashed border-gray-200 rounded-full px-3 py-1.5">
              <span className="text-gray-300 text-sm">+</span>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                placeholder="añadir tag"
                className="text-sm text-gray-600 bg-transparent outline-none w-24 placeholder-gray-300"
              />
            </div>
          </div>

          {current.analyzeError && (
            <p className="text-xs text-amber-500 mt-2">Análisis incompleto — añade tags manualmente</p>
          )}

          {!current.es_tatuaje && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-2 rounded-xl">
              La IA no detectó un tatuaje en esta imagen. Se saltará al publicar.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-30">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button
              onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
              disabled={reviewIndex === 0}
              className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl disabled:opacity-30 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="flex gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === reviewIndex ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {reviewIndex < total - 1 ? (
              <button
                onClick={() => setReviewIndex(reviewIndex + 1)}
                className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={uploadAll}
                className="flex items-center gap-1 px-4 py-2.5 text-sm text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Publicar
                <Upload size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 4: UPLOADING ──
  if (step === 'upload') {
    const uploaded = items.filter(it => it.uploaded).length
    const total = items.filter(it => it.es_tatuaje).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Upload size={32} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subiendo...</h2>
        <p className="text-sm text-gray-400 mb-6">{uploaded} / {total}</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP 5: DONE ──
  const ok = items.filter(it => it.uploaded).length
  const skipped = items.filter(it => !it.es_tatuaje).length
  const failed = items.filter(it => it.uploadError && !it.uploaded).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        {ok} foto{ok !== 1 ? 's' : ''} publicada{ok !== 1 ? 's' : ''}
      </h2>
      {skipped > 0 && <p className="text-sm text-gray-400">{skipped} saltada{skipped !== 1 ? 's' : ''} (no tatuaje)</p>}
      {failed > 0 && <p className="text-sm text-red-500 mt-1">{failed} fallaron</p>}

      <div className="flex gap-3 justify-center mt-8">
        <button
          onClick={() => { setItems([]); setStep('select') }}
          className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-200 transition-colors"
        >
          Subir más
        </button>
        <button
          onClick={() => router.push(`/perfil/${user.user_metadata?.username || user.id}`)}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
        >
          Ver mi perfil
        </button>
      </div>
    </div>
  )
}
