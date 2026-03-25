#!/usr/bin/env node
/**
 * reupload-classified.js
 * Sube todas las fotos clasificadas en subcarpetas de "raw 2"
 * (excepto sin-identificar/) a Supabase Storage + BD.
 * Genera nombres únicos con timestamp + random para evitar colisiones.
 */

const fs   = require('fs')
const path = require('path')

// ── Cargar .env.local ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const { createClient } = require('@supabase/supabase-js')
const sharp            = require('sharp')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const RAW_DIR      = '/Users/trafalgarclaw/Desktop/raw 2'
const TATUADOR_ID  = 'c01f31dd-5898-4a95-9061-ab66c65102df'
const BUCKET       = 'photos'
const CONCURRENCY  = 3
const PAUSE_MS     = 1000
const RETRY_MAX    = 2
const LOG_FILE     = '/Users/trafalgarclaw/Desktop/resumen-raw2-upload.txt'
const IMAGE_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const SKIP_DIRS    = new Set(['sin-identificar'])

const TAMANO_MAP = {
  'micro':   'pequeño',   // 'micro' not in DB check constraint, map to smallest
  'pequeno': 'pequeño',
  'mediano': 'mediano',
  'grande':  'grande',
}

// Categories to scan
const CATEGORIES = fs.readdirSync(RAW_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && !SKIP_DIRS.has(e.name))
  .map(e => e.name)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function uniqueName(category, origName) {
  const base = path.basename(origName, path.extname(origName))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n')
    .replace(/[^a-z0-9\-_]/gi, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .toLowerCase().slice(0, 50)
  const ts   = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${category}/${base}-${ts}-${rand}.webp`
}

function parseFilename(name) {
  // Format: {cat}_{desc}_{zona}_{tamano}_{num}.jpg
  const base  = path.basename(name, path.extname(name))
  const parts = base.split('_')
  if (parts.length >= 4) {
    return {
      motivo: parts[0],
      desc:   parts[1],
      zona:   parts[2],
      tamano: parts[3],
      tags:   [parts[0], ...parts[1].split('-').filter(t => t.length > 2)].slice(0, 5),
      alt_text: `Tatuaje ${parts[0]} ${parts[1].replace(/-/g, ' ')} ${parts[2]}`.slice(0, 100),
    }
  }
  return {
    motivo: parts[0] || 'varios',
    desc:   base,
    zona:   null,
    tamano: null,
    tags:   [parts[0] || 'fineline'],
    alt_text: `Tatuaje fine line ${base.replace(/-/g, ' ')}`.slice(0, 100),
  }
}

async function uploadOne(filePath, category) {
  const filename = path.basename(filePath)
  for (let attempt = 1; attempt <= RETRY_MAX + 1; attempt++) {
    try {
      const buffer = await sharp(filePath)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()

      const storagePath = uniqueName(category, filename)

      const { error: storErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: 'image/webp', upsert: false })
      if (storErr) throw new Error(storErr.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const info = parseFilename(filename)

      const { error: dbErr } = await supabase.from('photos').insert({
        url:         publicUrl,
        tatuador_id: TATUADOR_ID,
        tags:        info.tags,
        motivo:      info.motivo || null,
        zona:        info.zona   || null,
        tamaño:      TAMANO_MAP[info.tamano] || info.tamano || null,
        alt_text:    info.alt_text,
        title:       info.alt_text.slice(0, 80),
        status:      'published',
        likes:       0,
      })
      if (dbErr) throw new Error(dbErr.message)

      return { status: 'ok', file: filename, category, url: publicUrl }
    } catch (err) {
      if (attempt > RETRY_MAX) {
        return { status: 'error', file: filename, category, reason: err.message }
      }
      await sleep(500 * attempt)
    }
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗')
  console.log('║  Reupload classified photos → Supabase        ║')
  console.log('╚═══════════════════════════════════════════════╝\n')

  // Collect all images from category subdirs
  const files = []
  for (const cat of CATEGORIES) {
    const dir = path.join(RAW_DIR, cat)
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      if (e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase())) {
        files.push({ path: path.join(dir, e.name), category: cat })
      }
    }
  }

  console.log(`📁 Categorías: ${CATEGORIES.join(', ')}`)
  console.log(`🔍 ${files.length} fotos para subir\n`)

  if (!files.length) { console.log('Nada que subir.'); return }

  const start = Date.now()
  let ok = 0, errors = 0
  const errorList = []
  const catCounts = {}

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(f => uploadOne(f.path, f.category)))

    for (const r of results) {
      if (r.status === 'ok') {
        ok++
        catCounts[r.category] = (catCounts[r.category] || 0) + 1
        console.log(`  ✅ ${r.file} → ${r.category}`)
      } else {
        errors++
        errorList.push(r)
        console.log(`  ❌ ${r.file} → ${r.reason}`)
      }
    }

    const done = Math.min(i + CONCURRENCY, files.length)
    console.log(`  [${done}/${files.length}]\n`)

    if (i + CONCURRENCY < files.length) await sleep(PAUSE_MS)
  }

  const secs = Math.round((Date.now() - start) / 1000)
  const tiempo = secs >= 60 ? `${Math.floor(secs/60)}min ${secs%60}s` : `${secs}s`

  const lines = [
    `============================================================`,
    `RESUMEN UPLOAD — tattoosfineline.com`,
    `============================================================`,
    `Fecha: ${new Date().toLocaleString('es')}`,
    `Carpeta: ${RAW_DIR}`,
    ``,
    `✅ Subidas:  ${ok}`,
    `❌ Errores:  ${errors}`,
    `⏱  Tiempo:   ${tiempo}`,
    ``,
    `POR CATEGORÍA:`,
    `────────────────────────────────────────`,
  ]
  for (const [cat, n] of Object.entries(catCounts).sort((a,b) => b[1]-a[1])) {
    lines.push(`  ${cat.padEnd(28)} ${n}`)
  }
  if (errorList.length) {
    lines.push(``, `ERRORES:`, `────────────────────────────────────────`)
    for (const r of errorList) lines.push(`  ${r.file} → ${r.reason}`)
  }
  lines.push(`============================================================`)

  const summary = lines.join('\n')
  console.log('\n' + summary)
  fs.writeFileSync(LOG_FILE, summary, 'utf8')
  console.log(`\n📄 Log: ${LOG_FILE}\n`)
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1) })
