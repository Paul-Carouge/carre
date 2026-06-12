"use client"

import { useEffect, useState } from "react"

export function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState("")

  useEffect(() => {
    setText(formatTimeAgo(date))
    const interval = setInterval(() => setText(formatTimeAgo(date)), 60000)
    return () => clearInterval(interval)
  }, [date])

  return <span suppressHydrationWarning>{text}</span>
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`
  return new Date(dateStr).toLocaleDateString("fr-FR")
}
