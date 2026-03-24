import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const titulo = formData.get('titulo') as string ?? ''

  if (!file) {
    return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 })
  }

  // Análisis con Claude Vision
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'

  let tags: string[] = []
  let motivo = ''
  let zona = ''
  let tamaño = ''
  let confidence = 0.5
  let altText = titulo

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Analiza este tatuaje fine line. Responde SOLO con JSON válido:
{
  "es_tatuaje": true/false,
  "motivo": "floral|geometrico|minimalista|animales|letras-frases|abstracto|naturaleza|simbolos|retrato|arquitectura|otro",
  "zona": "brazo|antebrazo|muneca|mano|pierna|tobillo|pie|espalda|pecho|cuello|oreja|costilla|zona-desconocida",
  "tamaño": "micro|pequeño|mediano|grande",
  "tags": ["tag1","tag2","tag3"],
  "alt_text": "descripción SEO del tatuaje en español",
  "confidence": 0.0-1.0
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.es_tatuaje) {
        return NextResponse.json({ error: 'La imagen no parece ser un tatuaje' }, { status: 422 })
      }
      motivo = parsed.motivo ?? ''
      zona = parsed.zona ?? ''
      tamaño = parsed.tamaño ?? ''
      tags = parsed.tags ?? []
      altText = parsed.alt_text ?? titulo
      confidence = parsed.confidence ?? 0.5
    }
  } catch (e) {
    console.error('[Claude Vision]', e)
    confidence = 0.4
  }

  // Subir imagen a Supabase Storage
  const admin = getAdminClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${session.user.id}/${Date.now()}.${ext}`
  const { error: storageError } = await admin.storage
    .from('photos')
    .upload(fileName, bytes, { contentType: file.type, upsert: false })

  if (storageError) {
    return NextResponse.json({ error: `Error al subir imagen: ${storageError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('photos').getPublicUrl(fileName)

  // Determinar status según confidence
  const status = confidence >= 0.85 ? 'published' : confidence >= 0.60 ? 'pending' : 'review'

  // Guardar en tabla photos
  const { data: photo, error: dbError } = await admin
    .from('photos')
    .insert({
      url: publicUrl,
      title: titulo || altText.slice(0, 80),
      alt_text: altText,
      motivo,
      zona,
      tamaño,
      tags,
      confidence,
      status,
      tatuador_id: session.user.id,
      likes: 0,
    })
    .select('id')
    .single()

  if (dbError) {
    return NextResponse.json({ error: `Error al guardar: ${dbError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    id: photo.id,
    url: publicUrl,
    status,
    motivo,
    zona,
    tamaño,
    tags,
    confidence,
    mensaje:
      status === 'published'
        ? 'Publicado automáticamente'
        : status === 'pending'
        ? 'En revisión — confianza media'
        : 'Requiere revisión manual',
  })
}
