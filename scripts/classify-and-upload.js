#!/usr/bin/env node
/**
 * classify-and-upload.js
 * Paso 1: Clasifica fotos con Claude Vision → renombra → mueve a subcarpetas
 * Paso 2: Sube a Supabase Storage + inserta en BD
 * Paso 3: Genera resumen
 */

const fs   = require('fs')
const path = require('path')

// ── Cargar .env.local ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) { console.error('❌ .env.local no encontrado'); process.exit(1) }
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('❌ Faltan: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const Anthropic        = require('@anthropic-ai/sdk')
const sharp            = require('sharp')

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic.default({ apiKey: ANTHROPIC_KEY })

// ── Config ─────────────────────────────────────────────────────────────────
const RAW_DIR           = '/Users/trafalgarclaw/Desktop/raw 2'
const TATUADOR_ID       = 'c01f31dd-5898-4a95-9061-ab66c65102df'
const BUCKET            = 'photos'
const CONCURRENCY       = 3
const MAX_PX            = 1920
const WEBP_QUALITY      = 85
const RETRY_MAX         = 2
const PAUSE_MS          = 1000
const LOG_FILE          = '/Users/trafalgarclaw/Desktop/resumen-raw2.txt'
const IMAGE_EXTS        = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])

const CATEGORIES = [
  'floral', 'animales', 'astros', 'geometrico',
  'letras-frases', 'abstracto-simbolos', 'retrato-silueta', 'sin-identificar',
]

// Category mapping — IA motivo → folder
const CATEGORY_MAP = {
  'floral':    'floral',
  'flores':    'floral',
  'rosa':      'floral',
  'botanico':  'floral',
  'botanica':  'floral',
  'animal':    'animales',
  'animales':  'animales',
  'fauna':     'animales',
  'insecto':   'animales',
  'insectos':  'animales',
  'mariposa':  'animales',
  'serpiente': 'animales',
  'gato':      'animales',
  'perro':     'animales',
  'ave':       'animales',
  'pajaro':    'animales',
  'pez':       'animales',
  'astros':    'astros',
  'astro':     'astros',
  'luna':      'astros',
  'sol':       'astros',
  'estrella':  'astros',
  'estrellas': 'astros',
  'celestial': 'astros',
  'cosmos':    'astros',
  'geometrico':'geometrico',
  'geometria': 'geometrico',
  'mandala':   'geometrico',
  'letras':    'letras-frases',
  'letra':     'letras-frases',
  'frase':     'letras-frases',
  'frases':    'letras-frases',
  'texto':     'letras-frases',
  'tipografia':'letras-frases',
  'caligrafia':'letras-frases',
  'escritura': 'letras-frases',
  'palabra':   'letras-frases',
  'abstracto': 'abstracto-simbolos',
  'simbolo':   'abstracto-simbolos',
  'simbolos':  'abstracto-simbolos',
  'simbolico': 'abstracto-simbolos',
  'tribal':    'abstracto-simbolos',
  'retrato':   'retrato-silueta',
  'rostro':    'retrato-silueta',
  'cara':      'retrato-silueta',
  'silueta':   'retrato-silueta',
  'figura':    'retrato-silueta',
  'persona':   'retrato-silueta',
}

const PROMPT = `Eres experto en tatuajes de línea fina y microrealismo. Analiza esta imagen.
Devuelve SOLO JSON válido sin texto extra:
{
  "es_tatuaje": true/false,
  "tags": ["tag1","tag2","tag3"] (máx 5, específicos: floral, rosa, luna, mariposa, gato, serpiente, letras, frase, geometrico, mandala, retrato, etc. NUNCA tags genéricos como "tatuaje"),
  "zona": "brazo|muneca|tobillo|espalda|costillas|cuello|pierna|mano|detras-oreja|antebrazo|hombro|pecho|dedo|pie|sin-definir",
  "tamano": "micro|pequeno|mediano|grande",
  "motivo": "categoría principal en español sin tildes (floral, animales, astros, geometrico, letras, abstracto, simbolo, retrato, silueta)",
  "descripcion": "2-4 palabras descriptivas sin tildes ej: rosa-con-espinas, luna-creciente, frase-cursiva",
  "alt_text": "Descripción SEO en español máx 100 chars ej: Tatuaje rosa fine line muneca delicada",
  "confianza": number 0-100 (certeza de que es un tatuaje fine line de calidad)
}`

// ── Helpers ────────────────────────────────────────────────────────────────

function limpiar(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n').replace(/ü/gi, 'u')
    .replace(/[^a-z0-9\-]/gi, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .toLowerCase().slice(0, 50)
}

function mapCategory(motivo) {
  const key = limpiar(motivo)
  return CATEGORY_MAP[key] || 'sin-identificar'
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function analyzeWithClaude(imagePath) {
  const bytes     = fs.readFileSync(imagePath)
  const base64    = bytes.toString('base64')
  const ext       = path.extname(imagePath).toLowerCase()
  const mediaMap  = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
  const mediaType = mediaMap[ext] || 'image/jpeg'

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: PROMPT },
      ],
    }],
  })

  const text  = resp.content[0]?.type === 'text' ? resp.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON in response: ${text.slice(0, 100)}`)
  return JSON.parse(match[0])
}

async function compressToWebP(inputPath) {
  return sharp(inputPath)
    .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

// ── PASO 1: Clasificar ────────────────────────────────────────────────────

let counter = 0

async function classifyOne(imagePath) {
  const origName = path.basename(imagePath)

  for (let attempt = 1; attempt <= RETRY_MAX + 1; attempt++) {
    try {
      const a = await analyzeWithClaude(imagePath)

      if (!a.es_tatuaje) {
        // Move to sin-identificar
        const cat = 'sin-identificar'
        const destDir = path.join(RAW_DIR, cat)
        fs.mkdirSync(destDir, { recursive: true })
        counter++
        const newName = `${cat}_no-tatuaje_sin-definir_sin-definir_${String(counter).padStart(4, '0')}.jpg`
        const destPath = path.join(destDir, newName)
        fs.renameSync(imagePath, destPath)
        return { status: 'sin-id', file: origName, reason: 'no es tatuaje' }
      }

      const confianza = a.confianza ?? 50
      const cat       = confianza < 70 ? 'sin-identificar' : mapCategory(a.motivo)
      const desc      = limpiar(a.descripcion || a.tags?.[0] || 'tattoo')
      const zona      = limpiar(a.zona || 'sin-definir')
      const tamano    = limpiar(a.tamano || a.tamaño || 'sin-definir')

      const destDir = path.join(RAW_DIR, cat)
      fs.mkdirSync(destDir, { recursive: true })

      counter++
      const newName = `${cat}_${desc}_${zona}_${tamano}_${String(counter).padStart(4, '0')}.jpg`
      const destPath = path.join(destDir, newName)
      fs.renameSync(imagePath, destPath)

      return {
        status: cat === 'sin-identificar' ? 'sin-id' : 'classified',
        file: origName,
        newName,
        category: cat,
        zona,
        tags: a.tags || [],
        tamano,
        alt_text: a.alt_text || '',
        confianza,
        destPath,
      }
    } catch (err) {
      if (attempt > RETRY_MAX) {
        return { status: 'error', file: origName, reason: err.message }
      }
      await sleep(500 * attempt)
    }
  }
}

// ── PASO 2: Subir ─────────────────────────────────────────────────────────

async function uploadOne(result) {
  if (result.status !== 'classified') return result

  for (let attempt = 1; attempt <= RETRY_MAX + 1; attempt++) {
    try {
      const buffer = await compressToWebP(result.destPath)

      const storageName = result.newName.replace(/\.jpg$/, '.webp')
      const storagePath = `${result.category}/${storageName}`

      const { error: storErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: 'image/webp', upsert: false })
      if (storErr) throw new Error(`Storage: ${storErr.message}`)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const { error: dbErr } = await supabase.from('photos').insert({
        url:         publicUrl,
        tatuador_id: TATUADOR_ID,
        tags:        result.tags,
        motivo:      result.category,
        zona:        result.zona || null,
        tamaño:      result.tamano || null,
        alt_text:    result.alt_text || null,
        title:       (result.alt_text || result.newName).slice(0, 80),
        status:      'published',
        likes:       0,
      })
      if (dbErr) throw new Error(`DB: ${dbErr.message}`)

      return { ...result, status: 'uploaded', url: publicUrl }
    } catch (err) {
      if (attempt > RETRY_MAX) {
        return { ...result, status: 'error', reason: err.message }
      }
      await sleep(500 * attempt)
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  tattoosfineline — Classify & Upload Script  ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  // Collect images from root of raw 2 only (not subdirs — those are already classified)
  const entries = fs.readdirSync(RAW_DIR, { withFileTypes: true })
  const images  = entries
    .filter(e => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
    .map(e => path.join(RAW_DIR, e.name))

  if (!images.length) {
    console.log('⚠️  No hay imágenes nuevas en la raíz de "raw 2".')
    process.exit(0)
  }

  console.log(`🔍 ${images.length} imágenes encontradas.\n`)

  // ── PASO 1: Clasificar ─────────────────────────────────
  console.log('━━━ PASO 1: Clasificando con IA ━━━\n')
  const start = Date.now()
  const classified = []

  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const batch   = images.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(classifyOne))
    classified.push(...results)

    for (const r of results) {
      if (r.status === 'classified') {
        console.log(`  ✅ ${r.file} → ${r.category}/${r.newName}`)
      } else if (r.status === 'sin-id') {
        console.log(`  📁 ${r.file} → sin-identificar (${r.reason || `confianza ${r.confianza}%`})`)
      } else {
        console.log(`  ❌ ${r.file} → ERROR: ${r.reason}`)
      }
    }

    const done = Math.min(i + CONCURRENCY, images.length)
    console.log(`  [${done}/${images.length}]\n`)

    if (i + CONCURRENCY < images.length) await sleep(PAUSE_MS)
  }

  const toUpload = classified.filter(r => r.status === 'classified')
  const sinId    = classified.filter(r => r.status === 'sin-id')
  const errClass = classified.filter(r => r.status === 'error')

  console.log(`\n📊 Clasificación: ${toUpload.length} para subir, ${sinId.length} sin-identificar, ${errClass.length} errores\n`)

  // ── PASO 2: Subir ──────────────────────────────────────
  if (toUpload.length === 0) {
    console.log('⚠️  Nada que subir.')
  } else {
    console.log('━━━ PASO 2: Subiendo a Supabase ━━━\n')

    const uploaded = []
    for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
      const batch   = toUpload.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(uploadOne))
      uploaded.push(...results)

      for (const r of results) {
        if (r.status === 'uploaded') {
          console.log(`  ✅ ${r.newName} → subida OK`)
        } else {
          console.log(`  ❌ ${r.newName} → ERROR: ${r.reason}`)
        }
      }

      const done = Math.min(i + CONCURRENCY, toUpload.length)
      console.log(`  [${done}/${toUpload.length}]\n`)

      if (i + CONCURRENCY < toUpload.length) await sleep(PAUSE_MS)
    }

    var uploadOk  = uploaded.filter(r => r.status === 'uploaded').length
    var uploadErr = uploaded.filter(r => r.status === 'error').length
  }

  // ── PASO 3: Resumen ────────────────────────────────────
  const secs   = Math.round((Date.now() - start) / 1000)
  const mins   = Math.floor(secs / 60)
  const rest   = secs % 60
  const tiempo = mins > 0 ? `${mins}min ${rest}s` : `${rest}s`

  const lines = [
    `============================================================`,
    `RESUMEN UPLOAD — tattoosfineline.com`,
    `============================================================`,
    `Fecha: ${new Date().toLocaleString('es')}`,
    `Carpeta: ${RAW_DIR}`,
    `Total procesadas: ${images.length}`,
    ``,
    `✅ Subidas:           ${uploadOk || 0}`,
    `📁 Sin-identificar:   ${sinId.length}`,
    `❌ Errores:           ${(errClass.length) + (uploadErr || 0)}`,
    `⏱  Tiempo:            ${tiempo}`,
    ``,
    `POR CATEGORÍA:`,
    `────────────────────────────────────────`,
  ]

  // Count per category
  const cats = {}
  for (const r of classified) {
    if (r.status === 'classified' || r.status === 'uploaded') {
      cats[r.category] = (cats[r.category] || 0) + 1
    }
  }
  for (const [cat, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${cat.padEnd(28)} ${n}`)
  }
  if (sinId.length) lines.push(`  ${'sin-identificar'.padEnd(28)} ${sinId.length}`)

  if (errClass.length + (uploadErr || 0) > 0) {
    lines.push(``, `ERRORES:`, `────────────────────────────────────────`)
    for (const r of [...classified.filter(r => r.status === 'error')]) {
      lines.push(`  ${r.file} → ${r.reason}`)
    }
  }

  lines.push(`============================================================`)

  const summary = lines.join('\n')
  console.log('\n' + summary)

  fs.writeFileSync(LOG_FILE, summary, 'utf8')
  console.log(`\n📄 Log guardado en: ${LOG_FILE}\n`)
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message)
  process.exit(1)
})
