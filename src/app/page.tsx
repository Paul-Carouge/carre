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

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return String(n)
}

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
      {/* ══════════ HERO — Editorial, BIG, with personality ══════════ */}
      <ScrollReveal>
        <section className="section-gap relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute top-6 right-0 text-8xl sm:text-9xl opacity-[0.03] select-none pointer-events-none" aria-hidden="true">
            ✦
          </div>

          {/* Tagline */}
          <div className="mb-8">
            <span className="badge-warm inline-flex items-center gap-2 px-3 py-1">
              <span className="text-[#F0C060]">✦</span> Le forum des passionnés
            </span>
          </div>

          {/* Main heading — BIG, bold, editorial */}
          <h1 className="font-display text-7xl sm:text-8xl font-bold tracking-tighter leading-[0.88] max-w-3xl mb-6">
            4<span className="text-[#E85D3A]">×</span>4
          </h1>

          {/* Subtitle */}
          <p className="text-secondary text-base sm:text-lg max-w-lg leading-relaxed mb-12">
            Discussions structurées, communauté authentique, zéro distraction.
          </p>

          {/* Stats row — BIG numbers, tiny labels, warm terracotta */}
          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div className="flex flex-col gap-1">
              <span className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-[#E85D3A] tabular-nums">
                {fmt(stats.topics)}
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Sujets</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-[#E85D3A] tabular-nums">
                {fmt(stats.posts)}
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Messages</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-[#E85D3A] tabular-nums">
                {fmt(stats.users)}
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Membres</span>
            </div>
          </div>

          {/* Subtle bottom accent line */}
          <div className="mt-16 h-px bg-gradient-to-r from-[#E85D3A]/30 via-[#F0C060]/20 to-transparent w-full max-w-md" />
        </section>
      </ScrollReveal>

      {/* ══════════ CATEGORIES — Playful, airy, panel-interactive ══════════ */}
      <ScrollReveal delay={0.1}>
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xl text-[#F0C060]">✦</span>
            <h2 className="font-display text-2xl font-bold tracking-tight">Catégories</h2>
            <span className="text-xs font-mono text-muted-foreground ml-2">{categories.length} espaces</span>
          </div>
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <Link key={c.id} href={`/c/${c.slug}`} className="panel-interactive p-6 group flex flex-col gap-4">
                {/* Larger icon container */}
                <div className="flex items-start justify-between">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${c.color}15`, color: c.color }}
                  >
                    {ICONS[c.icon] || "💬"}
                  </div>
                  <span className="badge-warm text-[10px]">{c.topic_count} sujets</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold group-hover:text-[#E85D3A] transition-colors mb-1.5">
                    {c.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                </div>
              </Link>
            ))}
          </StaggerReveal>
        </section>
      </ScrollReveal>

      {/* ══════════ TOPICS TABLE — Airy, badge-warm / badge-cool ══════════ */}
      <ScrollReveal delay={0.15}>
        <section className="mb-24">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xl">💬</span>
            <h2 className="font-display text-2xl font-bold tracking-tight">Discussions récentes</h2>
          </div>

          <div className="panel overflow-hidden glow-terracotta">
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
                        {t.is_pinned && (
                          <span className="badge-warm text-[10px] flex items-center gap-0.5 px-1.5 py-0.5">
                            📌 Épinglé
                          </span>
                        )}
                        <Link href={`/t/${t.slug}`} className="font-semibold hover:text-[#E85D3A] transition-colors truncate">
                          {t.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href={`/u/${t.author?.username}`} className="font-medium hover:text-foreground">
                          {t.author?.display_name || t.author?.username}
                        </Link>
                        <span>·</span>
                        <TimeAgo date={t.created_at} />
                        {t.category && (
                          <>
                            <span>·</span>
                            <Link href={`/c/${t.category.slug}`} className="badge-cool text-[10px] hover:opacity-80 transition-opacity">
                              {t.category.name}
                            </Link>
                          </>
                        )}
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
                            <span className="truncate block text-muted-foreground">
                              {t.last_reply_author.display_name || t.last_reply_author.username}
                            </span>
                            <span className="text-muted-foreground/60">
                              <TimeAgo date={t.last_reply_at!} />
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          <TimeAgo date={t.created_at} />
                        </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-muted-foreground">
                      Aucun sujet.{" "}
                      <Link href="/new" className="text-[#E85D3A] hover:underline font-medium">
                        Lancez la première discussion
                      </Link>
                      .
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
