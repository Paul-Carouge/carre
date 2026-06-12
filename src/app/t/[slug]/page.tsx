import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/TimeAgo"
import { ReplyForm } from "./ReplyForm"
import { LikeButton } from "@/components/LikeButton"
import Link from "next/link"
import type { Post, Topic } from "@/lib/types"

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: topic } = await supabase.from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*)`).eq("slug", slug).single()
  if (!topic) notFound()
  const t = topic as Topic

  await supabase.from("topics").update({ view_count: t.view_count + 1 }).eq("id", t.id).throwOnError()

  const { data: posts } = await supabase.from("posts")
    .select(`*, author:profiles(*)`).eq("topic_id", t.id).order("created_at", { ascending: true }).throwOnError()

  const postIds = (posts as Post[]).map(p => p.id)
  const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", postIds)
  const lc = new Map<string, number>(); likes?.forEach((l: any) => lc.set(l.post_id, (lc.get(l.post_id) || 0) + 1))
  const { data: { user } } = await supabase.auth.getUser()
  const { data: ul } = user ? await supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] }
  const us = new Set(ul?.map((l: any) => l.post_id) || [])
  const pw = (posts as Post[]).map(p => ({ ...p, like_count: lc.get(p.id) || 0, is_liked: us.has(p.id) }))

  return (
    <div className="container-fluid content-constrain py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 font-mono">
        <Link href="/" className="hover:text-foreground">Accueil</Link><span>/</span>
        {t.category && <><Link href={`/c/${t.category.slug}`} className="hover:text-foreground">{t.category.name}</Link><span>/</span></>}
        <span className="text-foreground/60 truncate">{t.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          {t.is_pinned && <Badge variant="outline" className="rounded-sm text-[10px] border-primary/40 text-primary h-4 font-mono">📌 Épinglé</Badge>}
          {t.is_locked && <Badge variant="outline" className="rounded-sm text-[10px] h-4 font-mono">🔒 Fermé</Badge>}
          {t.category && <Badge className="rounded-sm text-[10px] h-4 font-mono" style={{ background: `${t.category.color}18`, color: t.category.color }}>{t.category.name}</Badge>}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-4">{t.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="size-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}
          </div>
          <Link href={`/u/${t.author?.username}`} className="font-semibold text-foreground hover:text-primary">{t.author?.display_name || t.author?.username}</Link>
          <span>·</span><TimeAgo date={t.created_at} />
          <span>·</span><span className="font-mono">{t.view_count} vues</span>
          <span>·</span><span className="font-mono">{t.reply_count} réponses</span>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl">
        {pw.map((post, i) => (
          <div key={post.id} id={`post-${post.id}`} className={`post-card ${i === 0 ? "pt-0" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/u/${post.author?.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ring-1 ring-border">
                  {(post.author?.display_name || post.author?.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-semibold hover:text-primary transition-colors block">{post.author?.display_name || post.author?.username}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">@{post.author?.username} · {post.author?.post_count || 0} msg</span>
                </div>
              </Link>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <TimeAgo date={post.created_at} />
                {post.is_edited && <span className="italic">(modifié)</span>}
              </div>
            </div>
            <div className="prose-forum" dangerouslySetInnerHTML={{ __html: post.content }} />
            <div className="flex items-center gap-3 mt-4">
              <LikeButton post={post} />
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      <div className="mt-10 pt-8 border-t border-border max-w-3xl">
        {!t.is_locked ? <ReplyForm topicId={t.id} /> : (
          <div className="panel p-10 text-center text-muted-foreground">🔒 Cette discussion est fermée.</div>
        )}
      </div>
    </div>
  )
}
