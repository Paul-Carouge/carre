"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      listener.subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-noir/95 backdrop-blur-md border-b border-white/[0.05]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-or hover:text-or-glow transition-colors"
        >
          Carré
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/new"
                className="btn-primary text-sm"
              >
                Nouveau sujet
              </Link>
              <Link
                href={`/u/${user.user_metadata?.username || user.id}`}
                className="w-8 h-8 rounded-full bg-or-muted border border-or/20 flex items-center justify-center text-or text-xs font-medium hover:border-or/40 transition-colors"
              >
                {(user.user_metadata?.display_name || user.email || "?")[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-ghost text-sm">
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
