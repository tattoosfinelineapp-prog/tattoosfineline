'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle, X, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import imageCompression from 'browser-image-compression'

const TAGS_SUGERIDOS = [
  'floral', 'minimalista', 'geométrico', 'animales', 'luna', 'mariposa',
  'rosa', 'letras', 'abstracto', 'naturaleza', 'símbolos', 'retrato',
  'brazo', 'tobillo', 'muñeca', 'espalda', 'costilla', 'nuca',
]

type FileItem = {
  id: string
  file: File
  preview: string
  titulo: string
  // AI analysis
  motivo: string
  zona: string
  tamaño: string
  tags: string[]
  alt_text: string
  confidence: number
  analyzed: boolean
  analyzing: boolean
  analyzeError: string
  // Upload state
  uploaded: boolean
  uploading: boolean
  uploadError: string
  resultId?: string
}

type Step = 'select' | 'analyze' | 'edit' | 'upload' | 'done'

const MAX_FILES = 20
const MAX_SIZE_MB = 10

export default function UploadPage() {
  const { user, openAuthModal } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [items, setItems] = useState<FileItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [consent, setConsent] = useState(false)
  const [tagInput, setTagInput] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const makeItem = (file: File): FileItem | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return null
    return {
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      titulo: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      motivo: '', zona: '', tamaño: '', tags: [], alt_text: '',
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
              ? { ...it, analyzing: false, analyzed: true, ...json, analyzeError: json.error ?? '' }
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
    setSelected(new Set(items.map(it => it.id)))
  }

  const updateItem = (id: string, patch: Partial<FileItem>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const removeTag = (id: string, tag: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, tags: it.tags.filter(t => t !== tag) } : it))

  const addTag = (id: string, tag: string) => {
    if (!tag.trim()) return
    setItems(prev => prev.map(it =>
      it.id === id && !it.tags.includes(tag.trim())
        ? { ...it, tags: [...it.tags, tag.trim()] }
        : it
    ))
    setTagInput(prev => ({ ...prev, [id]: '' }))
  }

  const applyToSelected = (patch: Partial<Pick<FileItem, 'motivo' | 'zona' | 'tamaño'>>) => {
    setItems(prev => prev.map(it => selected.has(it.id) ? { ...it, ...patch } : it))
  }

  const uploadAll = async () => {
    setStep('upload')
    setUploadProgress(0)
    const toUpload = items.filter(it => !it.uploaded)
    let done = 0

    for (const item of toUpload) {
      updateItem(item.id, { uploading: true })
      try {
        const compressed = await compressFile(item.file)
        const fd = new FormData()
        fd.append('file', compressed)
        fd.append('titulo', item.titulo)
        fd.append('motivo', item.motivo)
        fd.append('zona', item.zona)
        fd.append('tamaño', item.tamaño)
        fd.append('tags', JSON.stringify(item.tags))
        fd.append('alt_text', item.alt_text)
        fd.append('confidence', String(item.confidence))

        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()

        if (!res.ok) {
          updateItem(item.id, { uploading: false, uploadError: json.error ?? 'Error' })
        } else {
          updateItem(item.id, { uploading: false, uploaded: true, resultId: json.id })
        }
      } catch {
        updateItem(item.id, { uploading: false, uploadError: 'Error de red' })
      }
      done++
      setUploadProgress(Math.round((done / toUpload.length) * 100))
    }
    setStep('done')
  }

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

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

  // ── STEP: SELECT ────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Subir fotos</h1>
          <p className="text-sm text-gray-400 mt-1">Hasta {MAX_FILES} fotos a la vez · JPG, PNG, WEBP · Máx. {MAX_SIZE_MB}MB c/u</p>
        </div>

        {/* Drop zone */}
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
          <p className="text-xs text-gray-400 mt-1">Selecciona hasta {MAX_FILES} imágenes a la vez</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* Thumbnails */}
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

            {/* Consent checkbox */}
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
                Recomendamos subir fotos del tatuaje sin mostrar el rostro completo.
              </span>
            </label>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{items.length} foto{items.length !== 1 ? 's' : ''} seleccionada{items.length !== 1 ? 's' : ''}</p>
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

  // ── STEP: ANALYZE ────────────────────────────────────────────
  if (step === 'analyze') {
    const analyzed = items.filter(it => it.analyzed).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Loader2 size={32} className="mx-auto mb-4 text-gray-400 animate-spin" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Analizando con IA...</h2>
        <p className="text-sm text-gray-400 mb-6">{analyzed} / {items.length} fotos</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${analyzeProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP: EDIT ────────────────────────────────────────────
  if (step === 'edit') {
    const selCount = selected.size
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revisar y editar tags</h2>
            <p className="text-sm text-gray-400 mt-1">{items.length} fotos analizadas</p>
          </div>
          <button
            onClick={uploadAll}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
          >
            <Upload size={15} />
            Publicar {items.length} foto{items.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Bulk actions */}
        {selCount > 1 && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center">
            <p className="text-sm font-medium text-gray-700">{selCount} seleccionadas:</p>
            {(['floral','geometrico','minimalista','animales','letras-frases','naturaleza'] as const).map(m => (
              <button key={m} onClick={() => applyToSelected({ motivo: m })} className="px-3 py-1 bg-white border border-gray-200 text-xs rounded-full hover:bg-gray-100 transition-colors">
                motivo: {m}
              </button>
            ))}
          </div>
        )}

        {/* Items grid */}
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`border rounded-2xl p-4 transition-colors ${
                selected.has(item.id) ? 'border-gray-300 bg-white' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex gap-4">
                {/* Checkbox + thumbnail */}
                <div className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="absolute top-1 left-1 z-10 w-4 h-4 accent-gray-900"
                  />
                  <img src={item.preview} alt="" className="w-20 h-20 object-cover rounded-xl" />
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.titulo}
                    onChange={e => updateItem(item.id, { titulo: e.target.value })}
                    placeholder="Título"
                    className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-gray-200"
                  />

                  <div className="flex gap-2 mb-2">
                    <select
                      value={item.motivo}
                      onChange={e => updateItem(item.id, { motivo: e.target.value })}
                      className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-200"
                    >
                      <option value="">Motivo</option>
                      {['floral','geometrico','minimalista','animales','letras-frases','abstracto','naturaleza','simbolos','retrato','otro'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={item.zona}
                      onChange={e => updateItem(item.id, { zona: e.target.value })}
                      className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-200"
                    >
                      <option value="">Zona</option>
                      {['brazo','antebrazo','muneca','mano','pierna','tobillo','pie','espalda','pecho','cuello','oreja','costilla'].map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                    <select
                      value={item.tamaño}
                      onChange={e => updateItem(item.id, { tamaño: e.target.value })}
                      className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-200"
                    >
                      <option value="">Tamaño</option>
                      {['micro','pequeño','mediano','grande'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                        <button onClick={() => removeTag(item.id, tag)}><X size={10} /></button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput[item.id] ?? ''}
                      onChange={e => setTagInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(item.id, tagInput[item.id] ?? '') } }}
                      placeholder="+ tag"
                      className="text-xs bg-transparent outline-none w-16 placeholder-gray-300"
                    />
                  </div>

                  {/* Suggested tags */}
                  <div className="flex flex-wrap gap-1">
                    {TAGS_SUGERIDOS.filter(t => !item.tags.includes(t)).slice(0, 5).map(t => (
                      <button key={t} onClick={() => addTag(item.id, t)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        +{t}
                      </button>
                    ))}
                  </div>

                  {item.analyzeError && (
                    <p className="text-xs text-amber-600 mt-1">⚠ {item.analyzeError} — edita los tags manualmente</p>
                  )}
                </div>

                {/* Confidence badge */}
                <div className="shrink-0 text-right">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    item.confidence >= 0.85 ? 'bg-green-50 text-green-600' :
                    item.confidence >= 0.60 ? 'bg-amber-50 text-amber-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={uploadAll}
            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
          >
            <Upload size={16} />
            Publicar {items.length} foto{items.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: UPLOADING ────────────────────────────────────────────
  if (step === 'upload') {
    const uploaded = items.filter(it => it.uploaded).length
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Upload size={32} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subiendo fotos...</h2>
        <p className="text-sm text-gray-400 mb-6">{uploaded} / {items.length} subidas</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-900 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  // ── STEP: DONE ────────────────────────────────────────────
  const ok = items.filter(it => it.uploaded)
  const failed = items.filter(it => it.uploadError)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        {ok.length} foto{ok.length !== 1 ? 's' : ''} publicada{ok.length !== 1 ? 's' : ''}
      </h2>
      {failed.length > 0 && (
        <p className="text-sm text-red-500 mb-4">
          <AlertCircle size={14} className="inline mr-1" />
          {failed.length} fallaron — puedes reintentar
        </p>
      )}

      {/* Thumbnails */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 my-6">
        {ok.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={item.preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
          </div>
        ))}
        {failed.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={item.preview} alt="" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={16} className="text-red-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setItems([]); setStep('select') }}
          className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-2xl hover:bg-gray-200 transition-colors"
        >
          Subir más fotos
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
        >
          Ver galería
        </button>
      </div>
    </div>
  )
}
