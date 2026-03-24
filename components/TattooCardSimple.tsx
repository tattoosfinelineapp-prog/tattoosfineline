'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Tattoo } from '@/lib/data'

export default function TattooCardSimple({ tattoo }: { tattoo: Tattoo }) {
  return (
    <Link href={`/tattoo/${tattoo.id}`}>
      <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gray-50">
        <Image
          src={tattoo.url}
          alt={tattoo.alt_text || tattoo.title}
          width={300}
          height={tattoo.height || 300}
          className="w-full object-cover"
        />
      </div>
    </Link>
  )
}
