"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ForumHeader() {
  return (
    <header className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg tracking-tight hover:opacity-80 transition-opacity">
            4by4
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Accueil</Link>
            <Link href="/c/general" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Général</Link>
            <Link href="/c/technologie" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Tech</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/new">
            <Button size="sm" className="rounded-md bg-primary hover:bg-primary/90 text-xs h-7">+ Sujet</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
