"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/components/GlobalSearch"
import { NotificationBell } from "@/components/NotificationBell"
import gsap from "gsap"
import type { Profile } from "@/lib/types"

export function ForumHeader() {
  const [user, setUser] = useState<any>(null)
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
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null)
      if (!s?.user) setProfile(null)
    })
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
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-full">
        {/* Logo */}
        <Link href="/" className="font-display text-lg font-bold tracking-tight hover:text-primary transition-colors shrink-0">
          4by4
        </Link>

        {/* Center: Search */}
        <div className="hidden sm:flex flex-1 justify-center mx-4">
          <GlobalSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile search */}
          <div className="sm:hidden">
            <GlobalSearch />
          </div>

          {user && profile ? (
            <>
              {/* Notification bell */}
              <NotificationBell />

              {/* New topic button */}
              <Link href="/new" className="hidden sm:inline-flex">
                <Button size="default" className="rounded-lg bg-primary hover:bg-primary/90 font-semibold text-sm px-5 h-10">
                  + Nouveau sujet
                </Button>
              </Link>

              {/* User avatar + name */}
              <Link href={`/u/${profile.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1">
                <div className="size-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </div>
                <span className="hidden lg:inline text-[13px] font-medium text-muted-foreground">{profile.display_name || profile.username}</span>
              </Link>

              {/* Mobile new topic (icon only) */}
              <Link href="/new" className="sm:hidden">
                <div className="size-9 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 transition-colors">
                  <svg className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>
                </div>
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
