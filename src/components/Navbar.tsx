"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    const h = () => setScrolled(window.scrollY > 0)
    window.addEventListener("scroll", h, { passive: true })
    return () => { listener.subscription.unsubscribe(); window.removeEventListener("scroll", h) }
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tighter text-foreground hover:text-primary transition-colors"
        >
          4×4
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/new">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-xs"
                >
                  + Sujet
                </Button>
              </Link>
              <Link href={`/u/${user.user_metadata?.username || user.id}`}>
                <Avatar className="size-7 ring-1 ring-border hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                    {(user.user_metadata?.display_name || user.email || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs rounded-full">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
