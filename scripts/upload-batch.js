#!/usr/bin/env node
/**
 * upload-batch.js — Subida masiva de fotos a tattoosfineline.com
 *
 * Uso: node scripts/upload-batch.js
 *
 * Dependencias: sharp, @supabase/supabase-js, @anthropic-ai/sdk
 * Credenciales: leídas de .env.local en la raíz del proyecto
 */

const fs   = require('fs')
const path = require('path')
const readline = require('readline')

// ── Cargar .env.local ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró .env.local en', envPath)
  process.exit(1)
}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY   // service role para bypasear RLS
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Faltan variables de entorno. Necesarias:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const Anthropic        = require('@anthropic-ai/sdk')
const sharp            = require('sharp')

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic.default({ apiKey: ANTHROPIC_API_KEY })

// ── Constantes ─────────────────────────────────────────────────────────────
const ADMIN_TATUADOR_ID = 'c01f31dd-5898-4a95-9061-ab66c65102df'
const BUCKET            = 'photos'
const CONCURRENCY       = 3
const MAX_PX            = 1920
const WEBP_QUALITY      = 85
const RETRY_TIMES       = 2
const BATCH_PAUSE_MS    = 1000
const LOG_FILE          = path.join(
  '/Users/trafalgarclaw/Desktop',
  `resumen-upload-${Date.now()}.txt`
)
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tiff'])

const CLAUDE_PROMPT = `Eres experto en tatuajes de línea fina y microrealismo. Analiza esta imagen.
Devuelve SOLO JSON válido sin texto extra:
{
  "es_tatuaje": boolean,
  "es_fineline": boolean,
  "tags": ["tag1","tag2"] (máx 5, específicos: floral, rosa, luna, mariposa, gato, serpiente, letras, frase, geométrico, mandala, acuarela, retrato, etc. NUNCA tags genéricos como "tatuaje"),
  "zona": "brazo|muñeca|tobillo|espalda|costillas|cuello|pierna|mano|detras-oreja|antebrazo|hombro|pecho|dedo|pie|sin-definir",
  "tamaño": "micro|pequeño|mediano|grande",
  "motivo": "categoría principal en español",
  "alt_text": "Descripción SEO en español máx 100 chars, ej: Tatuaje rosa fine line muñeca delicada"
}`

// ── Helpers ─────────────────────────────────────────────────────────────────

function limpiarNombre(filename) {
  const ext = path.extname(filename).toLowerCase()
  const base = path.basename(filename, ext)
  const limpio = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar tildes/diacríticos
    .replace(/ñ/gi, 'n')
    .replace(/ü/gi, 'u')
    .replace(/[^a-z0-9\-_]/gi, '-')    // todo lo demás → guión
    .replace(/-+/g, '-')               // guiones múltiples
    .replace(/^-|-$/g, '')             // guiones al inicio/fin
    .toLowerCase()
    .slice(0, 60)                       // longitud máxima
  const rand = Math.random().toString(36).slice(2, 6)
  return `${limpio}-${Date.now()}-${rand}.webp`
}

async function comprimirImagen(inputPath) {
  return sharp(inputPath)
    .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function analizarConClaude(imagePath) {
  const bytes    = fs.readFileSync(imagePath)
  const base64   = bytes.toString('base64')
  const ext      = path.extname(imagePath).toLowerCase()
  const mediaMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
  const mediaType = mediaMap[ext] ?? 'image/jpeg'

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: CLAUDE_PROMPT },
      ],
    }],
  })

  const text  = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Respuesta Claude no es JSON: ${text.slice(0, 120)}`)
  return JSON.parse(match[0])
}

async function subirStorage(buffer, storagePath) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/webp', upsert: false })
  if (error) throw new Error(`Storage error: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return publicUrl
}

async function insertarFoto({ url, tags, motivo, zona, tamano, alt_text }) {
  const { error } = await supabase.from('photos').insert({
    url,
    tatuador_id: ADMIN_TATUADOR_ID,
    tags,
    motivo:    motivo  || null,
    zona:      zona    || null,
    tamaño:    tamano  || null,
    alt_text:  alt_text|| null,
    title:     alt_text?.slice(0, 80) || 'Fine line tattoo',
    status:   'published',
    likes:     0,
  })
  if (error) throw new Error(`DB error: ${error.message}`)
}

async function procesarFoto(imagePath) {
  const filename = path.basename(imagePath)

  for (let attempt = 1; attempt <= RETRY_TIMES + 1; attempt++) {
    try {
      // 1. Analizar con Claude Vision
      const analisis = await analizarConClaude(imagePath)

      if (!analisis.es_tatuaje) {
        return { status: 'skip', reason: 'no es tatuaje', file: filename }
      }

      // 2. Comprimir a WebP
      const buffer = await comprimirImagen(imagePath)

      // 3. Construir path limpio en storage
      const motivoLimpio = (analisis.motivo || 'varios')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\-]/gi, '-').toLowerCase().slice(0, 30)
      const nombreLimpio = limpiarNombre(filename)
      const storagePath  = `${motivoLimpio}/${nombreLimpio}`

      // 4. Subir a Storage
      const url = await subirStorage(buffer, storagePath)

      // 5. Insertar en DB
      await insertarFoto({
        url,
        tags:      analisis.tags      || [],
        motivo:    analisis.motivo    || '',
        zona:      analisis.zona      || '',
        tamano:    analisis.tamaño    || analisis.tamano || '',
        alt_text:  analisis.alt_text  || '',
      })

      return {
        status: 'ok',
        file: filename,
        motivo: analisis.motivo,
        zona: analisis.zona,
        tags: (analisis.tags || []).join(', '),
        url,
      }
    } catch (err) {
      if (attempt > RETRY_TIMES) {
        return { status: 'error', file: filename, reason: err.message }
      }
      // esperar antes de reintentar
      await sleep(500 * attempt)
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function pregunta(rl, texto) {
  return new Promise(resolve => rl.question(texto, resolve))
}

function recogerImagenes(dirPath, recursivo) {
  const archivos = []
  const entries  = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name)
    if (entry.isDirectory() && recursivo) {
      archivos.push(...recogerImagenes(full, true))
    } else if (entry.isFile() && IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      archivos.push(full)
    }
  }
  return archivos
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   tattoosfineline — Upload Batch Script  ║')
  console.log('╚══════════════════════════════════════════╝\n')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const carpeta = (await pregunta(rl, '📁 Ruta de la carpeta con fotos: ')).trim()
  if (!fs.existsSync(carpeta) || !fs.statSync(carpeta).isDirectory()) {
    console.error('❌ La carpeta no existe:', carpeta)
    rl.close(); process.exit(1)
  }

  const resp = (await pregunta(rl, '🗂  ¿Procesar subcarpetas? [S/n]: ')).trim().toLowerCase()
  rl.close()
  const recursivo = resp !== 'n'

  const imagenes = recogerImagenes(carpeta, recursivo)
  if (!imagenes.length) {
    console.log('⚠️  No se encontraron imágenes en la carpeta.')
    process.exit(0)
  }

  console.log(`\n🔍 ${imagenes.length} imágenes encontradas. Procesando de ${CONCURRENCY} en ${CONCURRENCY}...\n`)

  const inicio  = Date.now()
  const logLines = [
    `RESUMEN UPLOAD — tattoosfineline.com`,
    `Fecha: ${new Date().toLocaleString('es')}`,
    `Carpeta: ${carpeta}`,
    `Total encontradas: ${imagenes.length}`,
    ``,
    `DETALLE:`,
    `────────────────────────────────────────`,
  ]

  let ok = 0, skipped = 0, errors = 0

  // Procesar en lotes de CONCURRENCY
  for (let i = 0; i < imagenes.length; i += CONCURRENCY) {
    const lote   = imagenes.slice(i, i + CONCURRENCY)
    const resultados = await Promise.all(lote.map(procesarFoto))

    for (const r of resultados) {
      if (r.status === 'ok') {
        ok++
        const msg = `✅ ${r.file} → ${r.motivo}/${r.zona} [${r.tags}]`
        console.log(msg)
        logLines.push(msg)
      } else if (r.status === 'skip') {
        skipped++
        const msg = `⏭  ${r.file} → saltada (${r.reason})`
        console.log(msg)
        logLines.push(msg)
      } else {
        errors++
        const msg = `❌ ${r.file} → ERROR: ${r.reason}`
        console.log(msg)
        logLines.push(msg)
      }
    }

    const progreso = Math.min(i + CONCURRENCY, imagenes.length)
    const pct = Math.round((progreso / imagenes.length) * 100)
    console.log(`   [${progreso}/${imagenes.length}] ${pct}%\n`)

    if (i + CONCURRENCY < imagenes.length) await sleep(BATCH_PAUSE_MS)
  }

  const segs   = Math.round((Date.now() - inicio) / 1000)
  const mins   = Math.floor(segs / 60)
  const sRest  = segs % 60
  const tiempo = mins > 0 ? `${mins}min ${sRest}s` : `${sRest}s`

  const resumen = [
    ``,
    `════════════════════════════════════════`,
    `✅ Subidas:  ${ok}`,
    `⏭  Saltadas: ${skipped}`,
    `❌ Errores:  ${errors}`,
    `⏱  Tiempo:   ${tiempo}`,
    `════════════════════════════════════════`,
  ]

  console.log('\n' + resumen.join('\n'))
  logLines.push(...resumen)

  fs.writeFileSync(LOG_FILE, logLines.join('\n'), 'utf8')
  console.log(`\n📄 Log guardado en: ${LOG_FILE}\n`)
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message)
  process.exit(1)
})
