import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories").select("*").order("sort_order").throwOnError()

  const { data: topics } = await supabase
    .from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .limit(15)
    .throwOnError()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* ── Hero ── */}
      <section className="mb-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Forum · Discussion
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter leading-[0.95] mb-6">
          LA
          <br />
          <span className="text-primary">PLACE</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/new">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-6 text-sm">
              Nouveau sujet
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Discutez de ce qui vous passionne. Aucun algorithme, juste des gens.
          </p>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories && categories.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold tracking-tight">Catégories</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {(categories as Category[]).length} espaces
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(categories as Category[]).map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cat.slug}`}
                className="group flex items-center gap-3 glass-panel rounded-xl p-4 hover-lift glow-lime transition-all"
              >
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${cat.color}18`, color: cat.color }}
                >
                  {cat.icon === "code" ? "</>" : cat.icon === "gamepad" ? "🎮" : cat.icon === "music" ? "🎵" : cat.icon === "image" ? "🖼" : cat.icon === "globe" ? "🌐" : "💬"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {cat.topic_count} sujet{cat.topic_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Separator className="bg-border" />

      {/* ── Recent Topics ── */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold tracking-tight">Discussions</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            récentes
          </span>
        </div>

        {topics && topics.length > 0 ? (
          <div className="space-y-px">
            {(topics as Topic[]).map((topic) => (
              <Link
                key={topic.id}
                href={`/t/${topic.slug}`}
                className="flex items-center gap-4 group py-3.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="size-8 ring-1 ring-border shrink-0">
                  <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                    {(topic.author?.display_name || topic.author?.username || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {topic.is_pinned && (
                      <Badge variant="outline" className="rounded-full text-[9px] px-1.5 py-0 border-primary/30 text-primary h-4">
                        Épinglé
                      </Badge>
                    )}
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {topic.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{topic.author?.display_name || topic.author?.username}</span>
                    <span>·</span>
                    <TimeAgo date={topic.created_at} />
                    {topic.category && (
                      <>
                        <span>·</span>
                        <span style={{ color: topic.category.color }}>{topic.category.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <span className="font-mono tabular-nums">{topic.reply_count}</span>
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4 text-sm">Aucune discussion. Soyez le premier.</p>
            <Link href="/new">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Lancer une discussion
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
