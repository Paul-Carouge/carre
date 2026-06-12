import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const likeCounts = new Map<string, number>()
  likes?.forEach((l: any) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1))

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userLikes } = user ? await supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds) : { data: [] }
  const userLikeSet = new Set(userLikes?.map((l: any) => l.post_id) || [])

  const postsWithLikes = (posts as Post[]).map(p => ({
    ...p, like_count: likeCounts.get(p.id) || 0, is_liked: userLikeSet.has(p.id),
  }))

  return (
    <div className="p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-5 font-mono">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {t.category && <><Link href={`/c/${t.category.slug}`} className="hover:text-foreground">{t.category.name}</Link><span>/</span></>}
        <span className="text-foreground/70 truncate">{t.title}</span>
      </div>

      {/* Topic Header */}
      <div className="bg-card border border-border rounded-lg p-5 mb-0 rounded-b-none">
        <div className="flex items-center gap-2 mb-2">
          {t.is_pinned && <Badge variant="outline" className="rounded-sm text-[9px] border-primary/30 text-primary h-4">📌 Épinglé</Badge>}
          {t.is_locked && <Badge variant="outline" className="rounded-sm text-[9px] h-4">🔒 Fermé</Badge>}
          {t.category && <Badge className="rounded-sm text-[9px] h-4" style={{ background: `${t.category.color}15`, color: t.category.color }}>{t.category.name}</Badge>}
        </div>
        <h1 className="font-display text-2xl">{t.title}</h1>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-3">
          <Avatar className="size-6 ring-1 ring-border"><AvatarImage src={t.author?.avatar_url || undefined} /><AvatarFallback className="text-[8px] bg-muted font-bold">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
          <Link href={`/u/${t.author?.username}`} className="font-medium text-foreground hover:underline">{t.author?.display_name || t.author?.username}</Link>
          <span>·</span>
          <TimeAgo date={t.created_at} />
          <span>·</span>
          <span className="font-mono">{t.view_count} vues</span>
          <span>·</span>
          <span className="font-mono">{t.reply_count} réponses</span>
        </div>
      </div>

      {/* Posts */}
      <div className="bg-card border-x border-border">
        {postsWithLikes.map((post, i) => (
          <div key={post.id} id={`post-${post.id}`} className="post-layout px-5">
            {/* User card — left */}
            <div className="text-center">
              <Link href={`/u/${post.author?.username}`}>
                <Avatar className="size-14 ring-1 ring-border mx-auto mb-2">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-sm font-bold">{(post.author?.display_name || post.author?.username || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/u/${post.author?.username}`} className="text-[13px] font-semibold hover:underline block">{post.author?.display_name || post.author?.username}</Link>
              <span className="text-[10px] text-muted-foreground font-mono">@{post.author?.username}</span>
              <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-muted-foreground font-mono">
                <span>{post.author?.post_count || 0} msg</span>
                <span>{post.author?.like_count || 0} ❤️</span>
              </div>
            </div>

            {/* Post content — right */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3 font-mono">
                <TimeAgo date={post.created_at} />
                {post.is_edited && <span className="italic">(modifié)</span>}
              </div>
              <div className="prose-forum" dangerouslySetInnerHTML={{ __html: post.content }} />
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                <LikeButton post={post} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      <div className="bg-card border border-border rounded-lg rounded-t-none p-5 mt-0">
        {!t.is_locked ? <ReplyForm topicId={t.id} /> : (
          <p className="text-sm text-muted-foreground text-center py-4">🔒 Cette discussion est fermée.</p>
        )}
      </div>
    </div>
  )
}
