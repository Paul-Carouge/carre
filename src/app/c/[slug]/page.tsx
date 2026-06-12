import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/TimeAgo"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"

const ICONS: Record<string, string> = { code: "</>", gamepad: "🎮", music: "🎵", image: "🖼", globe: "🌐" }

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
    <div className="container-fluid content-constrain py-10">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 font-mono">
        <Link href="/" className="hover:text-foreground">Accueil</Link><span>/</span><span className="text-foreground">{cat.name}</span>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="size-12 rounded-xl flex items-center justify-center text-xl" style={{ background: `${cat.color}15`, color: cat.color }}>{ICONS[cat.icon] || "💬"}</div>
          <div>
            <h1 className="font-display text-2xl font-bold">{cat.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{cat.topic_count} sujets</p>
          </div>
        </div>
        {cat.description && <p className="text-muted-foreground max-w-2xl">{cat.description}</p>}
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
            {(topics as Topic[]).length > 0 ? (topics as Topic[]).map(t => (
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
                  </div>
                </td>
                <td className="col-stats">
                  <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                    <span>{t.reply_count} rép.</span><span>{t.view_count} vues</span>
                  </div>
                </td>
                <td className="col-last">
                  {t.last_reply_author ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-muted-foreground">{(t.last_reply_author.display_name || t.last_reply_author.username || "?")[0].toUpperCase()}</div>
                      <div className="min-w-0"><span className="truncate block text-muted-foreground">{t.last_reply_author.display_name || t.last_reply_author.username}</span><span className="text-muted-foreground/60"><TimeAgo date={t.last_reply_at!} /></span></div>
                    </div>
                  ) : <span className="text-xs text-muted-foreground/60"><TimeAgo date={t.created_at} /></span>}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-16 text-muted-foreground">Aucun sujet. <Link href="/new" className="text-primary hover:underline font-medium">Créez le premier</Link>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
