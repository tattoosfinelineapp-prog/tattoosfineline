import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Eres experto en tatuajes de línea fina y microrealismo. Analiza esta imagen.
Responde únicamente con JSON válido, sin texto extra:
{
  "es_tatuaje": true,
  "titulo": "tatuaje fine line de rosa en muñeca",
  "tags": ["floral", "rosa", "fine line"],
  "zona": "muñeca",
  "tamano": "pequeño",
  "motivo": "floral",
  "alt_text": "Tatuaje fine line de rosa con espinas en la muñeca, estilo minimalista",
  "contenido_explicito": false,
  "confianza": 0.9
}

Reglas estrictas:
- titulo: máximo 6 palabras, describe lo que ves (NO uses el nombre del archivo)
- tags: máximo 5, específicos de lo que ves (floral, rosa, luna, mariposa, gato, serpiente, letras, frase, geométrico, mandala, retrato, etc. NUNCA tags genéricos como "tatuaje")
- zona: brazo | antebrazo | muñeca | mano | pierna | tobillo | pie | espalda | pecho | cuello | oreja | costilla | hombro | dedo | sin-definir
- tamano: pequeño | mediano | grande
- motivo: categoría principal (floral, animales, astros, geometrico, letras-frases, abstracto-simbolos, retrato-silueta, naturaleza, cartoon-disney)
- es_tatuaje: false si la imagen NO muestra un tatuaje real en piel humana
- contenido_explicito: true solo si hay genitales o contenido sexual explícito
- alt_text: descripción SEO en español, máx 100 chars
- Si la confianza es baja, devuelve tags vacíos en lugar de tags incorrectos`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('[analyze] raw AI response:', text.slice(0, 300))
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[analyze] no JSON found in response')
      return NextResponse.json({ error: 'No JSON in response' }, { status: 422 })
    }

    const parsed = JSON.parse(match[0])
    console.log('[analyze] parsed:', JSON.stringify({ tags: parsed.tags, zona: parsed.zona, es_tatuaje: parsed.es_tatuaje }))

    if (parsed.contenido_explicito === true) {
      return NextResponse.json({
        error: 'contenido_explicito',
        mensaje: 'Esta imagen no cumple nuestras normas de contenido',
      }, { status: 422 })
    }

    return NextResponse.json({
      es_tatuaje:   parsed.es_tatuaje ?? true,
      titulo:       parsed.titulo ?? '',
      tags:         parsed.tags ?? [],
      zona:         parsed.zona ?? '',
      tamano:       parsed.tamano ?? '',
      motivo:       parsed.motivo ?? '',
      alt_text:     parsed.alt_text ?? '',
      confidence:   parsed.confianza ?? 0.5,
    })
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({
      es_tatuaje: true,
      titulo: '',
      tags: [], zona: '', tamano: '', motivo: '', alt_text: '', confidence: 0.4,
    })
  }
}
