import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

  const ICONS: Record<string, string> = { "code": "</>", "gamepad": "🎮", "music": "🎵", "image": "🖼", "globe": "🌐" }

  return (
    <div className="py-4">
      <div className="px-4 sm:px-6 flex items-center gap-1.5 text-[11px] text-muted-foreground mb-4 font-mono">
        <Link href="/" className="hover:text-foreground">Accueil</Link><span>/</span><span className="text-foreground">{cat.name}</span>
      </div>

      <div className="px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${cat.color}15`, color: cat.color }}>{ICONS[cat.icon] || "💬"}</div>
          <div>
            <h1 className="font-display text-xl font-bold">{cat.name}</h1>
            <p className="text-[11px] text-muted-foreground font-mono">{cat.topic_count} sujets</p>
          </div>
        </div>
        {cat.description && <p className="text-[13px] text-muted-foreground mt-2">{cat.description}</p>}
      </div>

      <div className="border-t border-b border-border">
        <div className="topic-row text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground bg-muted/30 px-4 sm:px-6 font-mono">
          <span>Sujet</span><span className="text-center">Stats</span><span className="last-post-col">Dernier message</span>
        </div>
        {(topics as Topic[]).length > 0 ? (topics as Topic[]).map(t => (
          <div key={t.id} className="topic-row px-4 sm:px-6 group">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-8 ring-1 ring-border shrink-0 group-hover:ring-primary/40 transition-all"><AvatarImage src={t.author?.avatar_url || undefined} /><AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {t.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/40 text-primary h-3.5 px-1">📌</Badge>}
                  <Link href={`/t/${t.slug}`} className="text-[13px] font-semibold hover:text-primary transition-colors truncate">{t.title}</Link>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <Link href={`/u/${t.author?.username}`} className="font-medium hover:text-foreground">{t.author?.display_name || t.author?.username}</Link>
                  <span>·</span><TimeAgo date={t.created_at} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
              <span>{t.reply_count} rép.</span><span>{t.view_count} vues</span>
            </div>
            <div className="last-post-col flex items-center gap-2 text-[11px]">
              {t.last_reply_author ? (
                <><Avatar className="size-5 ring-1 ring-border"><AvatarImage src={t.last_reply_author.avatar_url || undefined} /><AvatarFallback className="text-[7px] bg-muted font-bold text-muted-foreground">{(t.last_reply_author.display_name || t.last_reply_author.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0"><span className="truncate block text-muted-foreground">{t.last_reply_author.display_name || t.last_reply_author.username}</span><span className="text-muted-foreground/60"><TimeAgo date={t.last_reply_at!} /></span></div></>
              ) : <span className="text-muted-foreground/60"><TimeAgo date={t.created_at} /></span>}
            </div>
          </div>
        )) : <div className="p-10 text-center text-sm text-muted-foreground">Aucun sujet. <Link href="/new" className="text-primary hover:underline">Créez le premier</Link>.</div>}
      </div>
    </div>
  )
}
