"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
        setProfile(p)
      }
    })
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    const h = () => setScrolled(window.scrollY > 0)
    window.addEventListener("scroll", h, { passive: true })
    return () => { l.subscription.unsubscribe(); window.removeEventListener("scroll", h) }
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm" : "bg-background"
    }`}>
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg font-extrabold tracking-tighter text-foreground hover:text-primary transition-colors">
            4by4
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {["Général", "Tech", "Création", "Jeux"].map((l, i) => (
              <Link key={l}
                href={i === 0 ? "/c/general" : i === 1 ? "/c/technologie" : i === 2 ? "/c/creation" : "/c/jeux-video"}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
                {l}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && profile ? (
            <>
              <Link href="/new">
                <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 font-semibold text-xs h-8">
                  + Nouveau
                </Button>
              </Link>
              <Link href={`/u/${profile.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="size-7 ring-2 ring-background">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {(profile.display_name || profile.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs rounded-full">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
