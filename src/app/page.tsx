"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import type { Profile, Category, Topic } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/TimeAgo"

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

  return (
    <div className="p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-5 font-mono">
        <Link href="/" className="text-foreground font-medium">Accueil</Link>
      </div>

      {/* Categories grid */}
      {categories.length > 0 && (
        <section className="mb-8">
          <div className="forum-section-header"><h2>Catégories</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map(cat => (
              <Link key={cat.id} href={`/c/${cat.slug}`} className="cat-card group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{cat.icon === "code" ? "</>" : cat.icon === "gamepad" ? "🎮" : cat.icon === "music" ? "🎵" : cat.icon === "image" ? "🖼" : cat.icon === "globe" ? "🌐" : "💬"}</span>
                  <span className="text-[13px] font-semibold group-hover:text-primary transition-colors">{cat.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{cat.description}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-2">{cat.topic_count} sujets</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent topics table */}
      <section>
        <div className="forum-section-header">
          <h2>Sujets récents</h2>
          <Link href="/new">
            <Button size="sm" className="rounded-md bg-primary hover:bg-primary/90 text-xs h-7">+ Nouveau</Button>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="topic-row text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-4 font-mono">
            <span>Sujet</span>
            <span className="text-center">Stats</span>
            <span className="last-post-col">Dernier message</span>
          </div>

          {topics.length > 0 ? topics.map(topic => (
            <div key={topic.id} className="topic-row px-4 group">
              {/* Title column */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-8 ring-1 ring-border shrink-0">
                  <AvatarImage src={topic.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-[10px] font-bold">{(topic.author?.display_name || topic.author?.username || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {topic.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/30 text-primary h-4 px-1">📌</Badge>}
                    <Link href={`/t/${topic.slug}`} className="text-[13px] font-semibold hover:underline truncate">{topic.title}</Link>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                    <span>par</span>
                    <Link href={`/u/${topic.author?.username}`} className="font-medium hover:underline">{topic.author?.display_name || topic.author?.username}</Link>
                    <span>·</span>
                    <TimeAgo date={topic.created_at} />
                    {topic.category && <><span>·</span><span style={{ color: topic.category.color }}>{topic.category.name}</span></>}
                  </div>
                </div>
              </div>

              {/* Stats column */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
                <span title="Réponses">{topic.reply_count} rép.</span>
                <span title="Vues">{topic.view_count} vues</span>
              </div>

              {/* Last post column */}
              <div className="last-post-col flex items-center gap-2 text-[11px]">
                {topic.last_reply_author ? (
                  <>
                    <Avatar className="size-5 ring-1 ring-border"><AvatarImage src={topic.last_reply_author.avatar_url || undefined} /><AvatarFallback className="text-[7px] bg-muted font-bold">{(topic.last_reply_author.display_name || topic.last_reply_author.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <span className="truncate block text-foreground/70">{topic.last_reply_author.display_name || topic.last_reply_author.username}</span>
                      <span className="text-muted-foreground"><TimeAgo date={topic.last_reply_at!} /></span>
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground"><TimeAgo date={topic.created_at} /></span>
                )}
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Aucun sujet. <Link href="/new" className="text-primary hover:underline">Créez le premier</Link>.</div>
          )}
        </div>
      </section>
    </div>
  )
}
