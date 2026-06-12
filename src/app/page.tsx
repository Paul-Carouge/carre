"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/TimeAgo"
import type { Category, Topic } from "@/lib/types"

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [stats, setStats] = useState({ topics: 0, posts: 0, users: 0 })
  const supabase = createClient()

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => { if (data) setCategories(data as Category[]) })
    supabase.from("topics").select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
      .order("is_pinned", { ascending: false }).order("last_reply_at", { ascending: false, nullsFirst: false }).limit(25)
      .then(({ data }) => { if (data) setTopics(data as Topic[]) })
    supabase.from("topics").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, topics: count || 0 })))
    supabase.from("posts").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, posts: count || 0 })))
    supabase.from("profiles").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, users: count || 0 })))
  }, [])

  const ICONS: Record<string, string> = { "code": "</>", "gamepad": "🎮", "music": "🎵", "image": "🖼", "globe": "🌐" }

  return (
    <div className="py-4 px-4 sm:px-6">
      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-[11px] text-muted-foreground font-mono">
        <span><span className="text-foreground font-semibold">{stats.topics}</span> sujets</span>
        <span><span className="text-foreground font-semibold">{stats.posts}</span> messages</span>
        <span><span className="text-foreground font-semibold">{stats.users}</span> membres</span>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-6">
        {categories.map(c => (
          <Link key={c.id} href={`/c/${c.slug}`} className="card-panel card-panel-hover p-3.5 group transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{ICONS[c.icon] || "💬"}</span>
              <span className="text-[13px] font-semibold group-hover:text-primary transition-colors">{c.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-2">{c.topic_count} sujets</p>
          </Link>
        ))}
      </div>

      {/* Recent topics */}
      <div className="section-head">
        <h2>Sujets récents</h2>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="topic-row text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground bg-muted/30 font-mono">
          <span>Sujet</span><span className="text-center">Stats</span><span className="last-post-col">Dernier message</span>
        </div>
        {topics.length > 0 ? topics.map(t => (
          <div key={t.id} className="topic-row group">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 ring-1 ring-border shrink-0 group-hover:ring-primary/40 transition-all">
                <AvatarImage src={t.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {t.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/40 text-primary h-3.5 px-1">📌</Badge>}
                  <Link href={`/t/${t.slug}`} className="text-[13px] font-semibold hover:text-primary transition-colors truncate">{t.title}</Link>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <Link href={`/u/${t.author?.username}`} className="font-medium hover:text-foreground">{t.author?.display_name || t.author?.username}</Link>
                  <span>·</span><TimeAgo date={t.created_at} />
                  {t.category && <><span>·</span><span style={{ color: t.category.color }}>{t.category.name}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
              <span title="Réponses">{t.reply_count} rép.</span>
              <span title="Vues">{t.view_count} vues</span>
            </div>
            <div className="last-post-col flex items-center gap-2 text-[11px]">
              {t.last_reply_author ? (
                <>
                  <Avatar className="size-5 ring-1 ring-border"><AvatarImage src={t.last_reply_author.avatar_url || undefined} /><AvatarFallback className="text-[7px] bg-muted font-bold text-muted-foreground">{(t.last_reply_author.display_name || t.last_reply_author.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><span className="truncate block text-muted-foreground">{t.last_reply_author.display_name || t.last_reply_author.username}</span><span className="text-muted-foreground/60"><TimeAgo date={t.last_reply_at!} /></span></div>
                </>
              ) : <span className="text-muted-foreground/60"><TimeAgo date={t.created_at} /></span>}
            </div>
          </div>
        )) : (
          <div className="p-10 text-center text-sm text-muted-foreground">Aucun sujet. <Link href="/new" className="text-primary hover:underline">Créez le premier</Link>.</div>
        )}
      </div>
    </div>
  )
}
