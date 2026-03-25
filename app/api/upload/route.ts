import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[upload] Missing SUPABASE env vars:', { url: !!url, key: !!key })
    throw new Error('Supabase env vars not set')
  }
  return createClient(url, key)
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.error('[upload] No session')
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 })
  }

  // Fields from the analyze step
  const titulo       = formData.get('titulo') as string ?? ''
  const preMotivo    = formData.get('motivo') as string ?? ''
  const preZona      = formData.get('zona') as string ?? ''
  const preTamano    = formData.get('tamano') as string ?? ''  // normalized, no ñ
  const preTags      = formData.get('tags') ? JSON.parse(formData.get('tags') as string) as string[] : null
  const preAltText   = formData.get('alt_text') as string ?? ''
  const preConfStr            = formData.get('confidence') as string | null
  const tatuadorEtiquetadoId  = formData.get('tatuador_etiquetado_id') as string | null

  // If analyze step was run, preConfStr will be set — always skip re-analysis
  const skipAI = preConfStr !== null
  const preConfidence = preConfStr !== null ? parseFloat(preConfStr) : null

  console.log('[upload] user:', session.user.id, '| file:', file.name, file.size, file.type, '| skipAI:', skipAI)

  const bytes = await file.arrayBuffer()

  let tags: string[]  = preTags ?? []
  let motivo = preMotivo
  let zona   = preZona
  let tamano = preTamano
  let confidence = preConfidence ?? 0.5
  let altText = preAltText || titulo

  if (!skipAI) {
    // Fallback: analyze in-line if somehow analyze step was skipped
    console.log('[upload] running inline AI analysis...')
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Analiza este tatuaje. Responde SOLO JSON: {"es_tatuaje":true,"tags":["tag1"],"zona":"brazo","tamano":"pequeño","alt_text":"descripción","confianza":0.8}' },
          ],
        }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (!parsed.es_tatuaje) {
          return NextResponse.json({ error: 'La imagen no parece ser un tatuaje' }, { status: 422 })
        }
        tags = parsed.tags ?? []
        zona = parsed.zona ?? ''
        tamano = parsed.tamano ?? parsed.tamaño ?? ''
        altText = parsed.alt_text ?? titulo
        confidence = parsed.confianza ?? 0.5
      }
    } catch (e) {
      console.error('[upload] inline AI error:', e)
      confidence = 0.4
    }
  }

  // Upload to Supabase Storage
  let admin
  try {
    admin = getAdminClient()
  } catch (e) {
    console.error('[upload] admin client error:', e)
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  // Use webp extension if file type is webp, otherwise use original extension
  const ext = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg')
  const fileName = `${session.user.id}/${Date.now()}.${ext}`

  console.log('[upload] storing:', fileName, 'type:', file.type)

  const { error: storageError } = await admin.storage
    .from('photos')
    .upload(fileName, bytes, { contentType: file.type || 'image/jpeg', upsert: false })

  if (storageError) {
    console.error('[upload] storage error:', storageError)
    return NextResponse.json({ error: `Error al subir imagen: ${storageError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('photos').getPublicUrl(fileName)
  console.log('[upload] stored OK:', publicUrl)

  // Determine publication status from confidence
  const status = confidence >= 0.85 ? 'published'
    : confidence >= 0.60 ? 'pending'
    : 'review'

  console.log('[upload] inserting photo, status:', status, 'confidence:', confidence)

  const insertData: Record<string, unknown> = {
    url: publicUrl,
    title: titulo || altText.slice(0, 80) || 'Sin título',
    alt_text: altText || titulo || 'Tatuaje fine line',
    motivo: motivo || null,
    zona: zona || null,
    tags,
    confidence,
    status,
    tatuador_id: session.user.id,
    likes: 0,
  }

  // Only include tamaño if it has a value (avoids ñ column issues with empty strings)
  if (tamano) insertData['tamaño'] = tamano
  if (tatuadorEtiquetadoId) insertData['tatuador_etiquetado_id'] = tatuadorEtiquetadoId

  const { data: photo, error: dbError } = await admin
    .from('photos')
    .insert(insertData)
    .select('id')
    .single()

  if (dbError) {
    console.error('[upload] db error:', dbError)
    return NextResponse.json({ error: `Error al guardar: ${dbError.message}`, detail: dbError }, { status: 500 })
  }

  console.log('[upload] done, photo id:', photo.id, 'status:', status)

  // Update last_upload_at (fire and forget — SQL trigger also handles this, belt+suspenders)
  admin.from('users').update({ last_upload_at: new Date().toISOString() }).eq('id', session.user.id)

  return NextResponse.json({
    id: photo.id,
    url: publicUrl,
    status,
    mensaje:
      status === 'published' ? 'Publicado'
      : status === 'pending' ? 'En revisión'
      : 'Revisión manual requerida',
  })
}
