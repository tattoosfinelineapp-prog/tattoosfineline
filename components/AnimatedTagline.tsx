'use client'

import { useState, useEffect } from 'react'

const PHRASES = [
  'Tu inspiración fine line',
  'Miles de tatuajes únicos',
  'Encuentra tu próximo tatuaje',
]

export default function AnimatedTagline() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % PHRASES.length)
        setVisible(true)
      }, 350)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  return (
    <span
      className="inline-block transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {PHRASES[index]}
    </span>
  )
}
