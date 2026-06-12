"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ForumHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-display text-base font-bold tracking-tight text-foreground hover:text-primary transition-colors">
            4by4
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-[12px] font-medium">
            <Link href="/c/general" className="text-muted-foreground hover:text-foreground transition-colors">Général</Link>
            <Link href="/c/technologie" className="text-muted-foreground hover:text-foreground transition-colors">Tech</Link>
            <Link href="/c/creation" className="text-muted-foreground hover:text-foreground transition-colors">Création</Link>
            <Link href="/c/jeux-video" className="text-muted-foreground hover:text-foreground transition-colors">Jeux</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/new">
            <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-xs h-8 font-semibold">+ Sujet</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
