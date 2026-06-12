"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import gsap from "gsap"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"

export function ForumHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLHeadElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
        if (p) setProfile(p as Profile)
      }
    })
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => { l.subscription.unsubscribe(); window.removeEventListener("scroll", h) }
  }, [])

  useEffect(() => {
    gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" })
  }, [])

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-header border-b border-border shadow-lg shadow-black/10" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 sm:px-8 lg:px-12">
        <Link href="/" className="font-display text-lg font-bold tracking-tight hover:text-primary transition-colors">
          4by4
        </Link>

        <div className="flex items-center gap-3">
          {user && profile ? (
            <>
              <Link href={`/u/${profile.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="size-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-[13px] font-medium text-muted-foreground">{profile.display_name || profile.username}</span>
              </Link>
              <Link href="/new">
                <Button size="default" className="rounded-lg bg-primary hover:bg-primary/90 font-semibold text-sm px-6 h-10">
                  + Nouveau sujet
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-8 rounded-lg">Connexion</Button>
              </Link>
              <Link href="/new">
                <Button size="default" className="rounded-lg bg-primary hover:bg-primary/90 font-semibold text-sm px-6 h-10">
                  + Nouveau sujet
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
