import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single()
  if (!category) notFound()
  const cat = category as Category

  const { data: topics } = await supabase.from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .eq("category_id", cat.id).order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false }).limit(50).throwOnError()

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-5 font-mono">
        <Link href="/" className="hover:text-foreground">Accueil</Link><span>/</span><span className="text-foreground">{cat.name}</span>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${cat.color}12`, color: cat.color }}>
            {cat.icon === "code" ? "</>" : cat.icon === "gamepad" ? "🎮" : cat.icon === "music" ? "🎵" : cat.icon === "image" ? "🖼" : cat.icon === "globe" ? "🌐" : "💬"}
          </div>
          <div>
            <h1 className="font-display text-xl">{cat.name}</h1>
            <p className="text-[11px] text-muted-foreground font-mono">{cat.topic_count} sujets</p>
          </div>
        </div>
        {cat.description && <p className="text-[13px] text-muted-foreground">{cat.description}</p>}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="topic-row text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 px-4 font-mono">
          <span>Sujet</span><span className="text-center">Stats</span><span className="last-post-col">Dernier message</span>
        </div>
        {(topics as Topic[]).length > 0 ? (topics as Topic[]).map(topic => (
          <div key={topic.id} className="topic-row px-4 group">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 ring-1 ring-border shrink-0"><AvatarImage src={topic.author?.avatar_url || undefined} /><AvatarFallback className="bg-muted text-[10px] font-bold">{(topic.author?.display_name || topic.author?.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {topic.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/30 text-primary h-4 px-1">📌</Badge>}
                  <Link href={`/t/${topic.slug}`} className="text-[13px] font-semibold hover:underline truncate">{topic.title}</Link>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <span>par</span><Link href={`/u/${topic.author?.username}`} className="font-medium hover:underline">{topic.author?.display_name || topic.author?.username}</Link>
                  <span>·</span><TimeAgo date={topic.created_at} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
              <span>{topic.reply_count} rép.</span><span>{topic.view_count} vues</span>
            </div>
            <div className="last-post-col flex items-center gap-2 text-[11px]">
              {topic.last_reply_author ? (
                <>
                  <Avatar className="size-5 ring-1 ring-border"><AvatarImage src={topic.last_reply_author.avatar_url || undefined} /><AvatarFallback className="text-[7px] bg-muted font-bold">{(topic.last_reply_author.display_name || topic.last_reply_author.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><span className="truncate block text-foreground/70">{topic.last_reply_author.display_name || topic.last_reply_author.username}</span><span className="text-muted-foreground"><TimeAgo date={topic.last_reply_at!} /></span></div>
                </>
              ) : <span className="text-muted-foreground"><TimeAgo date={topic.created_at} /></span>}
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun sujet. <Link href="/new" className="text-primary hover:underline">Créez le premier</Link>.</div>
        )}
      </div>
    </div>
  )
}
