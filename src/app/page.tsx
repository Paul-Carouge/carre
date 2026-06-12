"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/TimeAgo"
import { ScrollReveal, StaggerReveal } from "@/components/ScrollReveal"
import type { Category, Topic } from "@/lib/types"

const ICONS: Record<string, string> = { code: "</>", gamepad: "🎮", music: "🎵", image: "🖼", globe: "🌐" }

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [stats, setStats] = useState({ topics: 0, posts: 0, users: 0 })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => { if (data) setCategories(data as Category[]) })
    supabase.from("topics").select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
      .order("is_pinned", { ascending: false }).order("last_reply_at", { ascending: false, nullsFirst: false }).limit(30)
      .then(({ data }) => { if (data) setTopics(data as Topic[]) })
    supabase.from("topics").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, topics: count || 0 })))
    supabase.from("posts").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, posts: count || 0 })))
    supabase.from("profiles").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, users: count || 0 })))
  }, [])

  return (
    <div className="container-fluid content-constrain">
      {/* ── Hero ── */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex gap-5 text-sm font-mono text-muted-foreground">
              <span><strong className="text-foreground text-lg">{stats.topics}</strong> sujets</span>
              <span><strong className="text-foreground text-lg">{stats.posts}</strong> messages</span>
              <span><strong className="text-foreground text-lg">{stats.users}</strong> membres</span>
            </div>
            <div className="flex-1" />
            <Link href="/new">
              <Button size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-sm h-9 font-semibold px-5">+ Nouveau sujet</Button>
            </Link>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.92] max-w-3xl">
            Le forum <span className="text-primary">structuré</span> pour les <span className="text-secondary">vraies</span> discussions
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mt-5 max-w-xl leading-relaxed">
            Pas d&apos;algorithme, pas de publicité, pas de distraction. Juste des sujets, des gens, et du contenu.
          </p>
        </section>
      </ScrollReveal>

      {/* ── Categories ── */}
      <ScrollReveal delay={0.1}>
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold tracking-tight">Catégories</h2>
            <span className="text-xs text-muted-foreground font-mono">{categories.length} espaces</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <Link key={c.id} href={`/c/${c.slug}`} className="cat-card group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${c.color}15`, color: c.color }}>
                    {ICONS[c.icon] || "💬"}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{c.topic_count} sujets</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── Topics Table ── */}
      <ScrollReveal delay={0.15}>
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold tracking-tight">Discussions récentes</h2>
          </div>

          <div className="panel overflow-hidden glow-orange">
            <table className="topic-table">
              <thead>
                <tr>
                  <th className="col-avatar"></th>
                  <th className="col-title">Sujet</th>
                  <th className="col-stats">Stats</th>
                  <th className="col-last">Dernier message</th>
                </tr>
              </thead>
              <tbody>
                {topics.length > 0 ? topics.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ring-1 ring-border">
                        {(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 mb-0.5">
                        {t.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/40 text-primary h-3.5 px-1 font-mono">📌</Badge>}
                        <Link href={`/t/${t.slug}`} className="font-semibold hover:text-primary transition-colors truncate">{t.title}</Link>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href={`/u/${t.author?.username}`} className="font-medium hover:text-foreground">{t.author?.display_name || t.author?.username}</Link>
                        <span>·</span><TimeAgo date={t.created_at} />
                        {t.category && <><span>·</span><span style={{ color: t.category.color }}>{t.category.name}</span></>}
                      </div>
                    </td>
                    <td className="col-stats">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                        <span>{t.reply_count} rép.</span>
                        <span>{t.view_count} vues</span>
                      </div>
                    </td>
                    <td className="col-last">
                      {t.last_reply_author ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                            {(t.last_reply_author.display_name || t.last_reply_author.username || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="truncate block text-muted-foreground">{t.last_reply_author.display_name || t.last_reply_author.username}</span>
                            <span className="text-muted-foreground/60"><TimeAgo date={t.last_reply_at!} /></span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60"><TimeAgo date={t.created_at} /></span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-muted-foreground">
                      Aucun sujet. <Link href="/new" className="text-primary hover:underline font-medium">Lancez la première discussion</Link>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
