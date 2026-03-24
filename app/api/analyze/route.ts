import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Analiza esta imagen para una galería de tatuajes. Responde SOLO con JSON válido, sin texto extra:
{
  "es_tatuaje": true,
  "es_fineline_o_microrealismo": true,
  "contenido_explicito": false,
  "contiene_cara": false,
  "nudity_parcial": false,
  "motivo": "floral|geometrico|minimalista|animales|letras-frases|abstracto|naturaleza|simbolos|retrato|otro",
  "zona": "brazo|antebrazo|muneca|mano|pierna|tobillo|pie|espalda|pecho|cuello|oreja|costilla|zona-desconocida",
  "tamaño": "micro|pequeño|mediano|grande",
  "tags": ["tag1","tag2","tag3","tag4"],
  "alt_text": "descripción SEO detallada en español",
  "confianza": 0.0
}

Reglas importantes:
- contenido_explicito: true solo si hay genitales o contenido sexual explícito
- contiene_cara: true si hay un rostro humano identificable (no dibujos/retratos de tatuaje)
- nudity_parcial: true para tatuajes en pecho/costillas/cadera sin ropa (normal en tatuajes)
- es_fineline_o_microrealismo: true si es estilo fine line, linework o microrealismo`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'No JSON in response' }, { status: 422 })

    const parsed = JSON.parse(match[0])

    // Rechazar contenido explícito
    if (parsed.contenido_explicito === true) {
      return NextResponse.json({
        error: 'contenido_explicito',
        mensaje: 'Esta imagen no cumple nuestras normas de contenido',
      }, { status: 422 })
    }

    return NextResponse.json({
      es_tatuaje: parsed.es_tatuaje ?? true,
      es_fineline_o_microrealismo: parsed.es_fineline_o_microrealismo ?? true,
      contiene_cara: parsed.contiene_cara ?? false,
      nudity_parcial: parsed.nudity_parcial ?? false,
      motivo: parsed.motivo ?? '',
      zona: parsed.zona ?? '',
      tamaño: parsed.tamaño ?? '',
      tags: parsed.tags ?? [],
      alt_text: parsed.alt_text ?? '',
      confidence: parsed.confianza ?? 0.5,
    })
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({
      es_tatuaje: true, es_fineline_o_microrealismo: true,
      contiene_cara: false, nudity_parcial: false,
      motivo: '', zona: '', tamaño: '', tags: [], alt_text: '', confidence: 0.4,
    })
  }
}
