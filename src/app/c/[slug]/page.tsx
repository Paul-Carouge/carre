import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
    .order("last_reply_at", { ascending: false, nullsFirst: false }).limit(30).throwOnError()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-[11px] text-muted-foreground mb-8 font-mono uppercase tracking-wider">
        <Link href="/" className="hover:text-primary transition-colors">← Forum</Link><span>/</span><span className="text-foreground">{cat.name}</span>
      </nav>

      <div className="panel-offwhite rounded-xl p-6 mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="size-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${cat.color}12`, color: cat.color }}>
            {cat.icon === "code" ? "</>" : cat.icon === "gamepad" ? "🎮" : cat.icon === "music" ? "🎵" : cat.icon === "image" ? "🖼" : cat.icon === "globe" ? "🌐" : "💬"}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{cat.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{cat.topic_count} sujet{cat.topic_count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
      </div>

      {topics && topics.length > 0 ? (
        <div className="divide-y divide-border">
          {(topics as Topic[]).map(t => (
            <Link key={t.id} href={`/t/${t.slug}`} className="flex items-center gap-4 group py-3.5 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
              <Avatar className="size-8 ring-1 ring-border shrink-0"><AvatarImage src={t.author?.avatar_url || undefined} /><AvatarFallback className="bg-muted text-[10px] font-bold">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {t.is_pinned && <Badge variant="outline" className="rounded-full text-[9px] border-primary/30 text-primary h-4">📌</Badge>}
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{t.title}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">{t.author?.display_name || t.author?.username}</span><span>·</span><TimeAgo date={t.created_at} />
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">{t.reply_count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel-offwhite rounded-xl p-12 text-center">
          <p className="text-muted-foreground mb-4 text-sm">Aucun sujet ici.</p>
          <Link href="/new"><Button variant="outline" size="sm" className="rounded-full text-xs">Créer le premier</Button></Link>
        </div>
      )}
    </div>
  )
}
