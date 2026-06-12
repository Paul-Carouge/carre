"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<Profile[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setUsers([]); setTopics([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const [{ data: u }, { data: tp }] = await Promise.all([
        supabase.from("profiles").select("*").or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(5),
        supabase.from("topics").select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*)`).ilike("title", `%${query}%`).order("last_reply_at", { ascending: false, nullsFirst: false }).limit(5),
      ])
      setUsers((u as Profile[]) || [])
      setTopics((tp as Topic[]) || [])
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  if (!open) return (
    <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
      className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--border-visible)] bg-card/50 text-muted-foreground text-xs hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:text-foreground transition-all w-48 sm:w-56">
      <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <span className="truncate">Rechercher…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[9px] font-mono text-muted-foreground/50 bg-muted rounded px-1 h-4 border border-border">⌘K</kbd>
    </button>
  )

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div ref={ref} className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[90vw] max-w-lg z-[61]">
        <div className="panel border-border shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <svg className="size-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground font-body"
              placeholder="Rechercher des gens, des sujets…" autoFocus />
            <kbd className="text-[9px] font-mono text-muted-foreground bg-muted rounded px-1 h-4 border border-border">esc</kbd>
          </div>
          <div className="max-h-[400px] overflow-y-auto py-2">
            {loading && <p className="px-4 py-3 text-xs text-muted-foreground font-mono">Recherche…</p>}
            {!loading && query.length < 2 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">Tapez au moins 2 caractères pour chercher.</p>
            )}
            {!loading && users.length === 0 && topics.length === 0 && query.length >= 2 && (
              <p className="px-4 py-3 text-xs text-muted-foreground">Aucun résultat pour « {query} ».</p>
            )}

            {users.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground font-mono uppercase tracking-wider">Membres</p>
                {users.map(u => (
                  <Link key={u.id} href={`/u/${u.username}`} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(u.display_name || u.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.display_name || u.username}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {topics.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground font-mono uppercase tracking-wider mt-1">Sujets</p>
                {topics.map(t => (
                  <Link key={t.id} href={`/t/${t.slug}`} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                    <div className="size-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-xs font-bold text-secondary shrink-0">#</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.author?.display_name || t.author?.username} · {t.reply_count} rép.
                      </p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
