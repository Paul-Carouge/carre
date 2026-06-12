import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").throwOnError()
  const { data: topics } = await supabase
    .from("topics").select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .order("is_pinned", { ascending: false }).order("last_reply_at", { ascending: false, nullsFirst: false }).limit(20).throwOnError()

  // Stats
  const { count: totalTopics } = await supabase.from("topics").select("*", { count: "exact", head: true })
  const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true })
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* ── Hero ── */}
      <section className="mb-16">
        <div className="panel-offblack rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <p className="section-number mb-3 text-primary/80">FORUM</p>
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tighter leading-[0.95] text-secondary-foreground mb-4">
            4by<span className="text-primary">4</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
            Un espace structuré pour les vraies discussions. Pas d&apos;algorithme, pas de publicité, juste des gens.
          </p>
          <Link href="/new">
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 font-semibold text-sm">
              Démarrer une discussion
            </Button>
          </Link>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
            {[
              { label: "Sujets", value: totalTopics || 0 },
              { label: "Messages", value: totalPosts || 0 },
              { label: "Membres", value: totalUsers || 0 },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-secondary-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories Grid 4by4 ── */}
      {categories && categories.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-number mb-1">01</p>
              <h2 className="font-display text-xl font-bold tracking-tight">Catégories</h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">{(categories as Category[]).length} espaces</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(categories as Category[]).map((cat) => (
              <Link key={cat.id} href={`/c/${cat.slug}`}
                className="group panel-offwhite rounded-xl p-4 hover-lift transition-all">
                <div className="size-9 rounded-lg flex items-center justify-center text-base mb-3"
                  style={{ background: `${cat.color}12`, color: cat.color }}>
                  {cat.icon === "code" ? "</>" : cat.icon === "gamepad" ? "🎮" : cat.icon === "music" ? "🎵" : cat.icon === "image" ? "🖼" : cat.icon === "globe" ? "🌐" : "💬"}
                </div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{cat.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{cat.description?.substring(0, 60)}</p>
                <Badge variant="secondary" className="mt-2 text-[10px] rounded-full">{cat.topic_count}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* ── Recent Topics ── */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-number mb-1">02</p>
            <h2 className="font-display text-xl font-bold tracking-tight">Discussions</h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">récentes</span>
        </div>

        {topics && topics.length > 0 ? (
          <div className="divide-y divide-border">
            {(topics as Topic[]).map((topic) => (
              <Link key={topic.id} href={`/t/${topic.slug}`}
                className="flex items-center gap-4 group py-4 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
                <Avatar className="size-9 ring-1 ring-border shrink-0">
                  <AvatarImage src={topic.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-[11px] font-bold text-muted-foreground">
                    {(topic.author?.display_name || topic.author?.username || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {topic.is_pinned && <Badge variant="outline" className="rounded-full text-[9px] border-primary/30 text-primary h-4">📌</Badge>}
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{topic.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">{topic.author?.display_name || topic.author?.username}</span>
                    <span>·</span>
                    <TimeAgo date={topic.created_at} />
                    {topic.category && <><span>·</span><span style={{ color: topic.category.color }}>{topic.category.name}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                  <span>{topic.reply_count}</span>
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel-offwhite rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4 text-sm">Aucune discussion. Soyez le premier.</p>
            <Link href="/new"><Button variant="outline" size="sm" className="rounded-full text-xs">Lancer une discussion</Button></Link>
          </div>
        )}
      </section>
    </div>
  )
}
