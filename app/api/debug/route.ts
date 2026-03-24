import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  const info: Record<string, unknown> = {
    url_set: !!url,
    url_full: url || 'EMPTY',
    key_set: !!key,
    key_preview: key ? key.slice(0, 20) + '...' : 'EMPTY',
  }

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', ...info })
  }

  try {
    const supabase = createClient(url, key)
    const { count, error } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })

    info.supabase_count = count
    info.supabase_error = error?.message ?? ''
  } catch (e) {
    info.exception = String(e)
  }

  return NextResponse.json(info)
}
