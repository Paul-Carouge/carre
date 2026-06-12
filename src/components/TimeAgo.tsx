"use client"

import { useEffect, useState } from "react"

export function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState("")
  useEffect(() => { setText(fmt(date)); const i = setInterval(() => setText(fmt(date)), 60000); return () => clearInterval(i) }, [date])
  return <span suppressHydrationWarning>{text}</span>
}

function fmt(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  const m = Math.floor(s / 60); const h = Math.floor(m / 60); const days = Math.floor(h / 24)
  if (s < 60) return "à l'instant"; if (m < 60) return `il y a ${m} min`
  if (h < 24) return `il y a ${h}h`; if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`
  return new Date(d).toLocaleDateString("fr-FR")
}
