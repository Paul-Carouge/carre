import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TimeAgo } from "@/components/TimeAgo"
import { ReplyForm } from "./ReplyForm"
import { LikeButton } from "@/components/LikeButton"
import Link from "next/link"
import type { Post, Topic } from "@/lib/types"

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: topic } = await supabase
    .from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*)`)
    .eq("slug", slug).single()

  if (!topic) notFound()

  await supabase.from("topics").update({ view_count: (topic as Topic).view_count + 1 }).eq("id", (topic as Topic).id).throwOnError()

  const { data: posts } = await supabase
    .from("posts").select(`*, author:profiles(*)`)
    .eq("topic_id", (topic as Topic).id).order("created_at", { ascending: true }).throwOnError()

  const postIds = (posts as Post[]).map(p => p.id)
  const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", postIds)
  const likeCounts = new Map<string, number>()
  likes?.forEach((l: any) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1))

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userLikes } = user
    ? await supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
    : { data: [] }
  const userLikeSet = new Set(userLikes?.map((l: any) => l.post_id) || [])

  const postsWithLikes = (posts as Post[]).map(p => ({
    ...p, like_count: likeCounts.get(p.id) || 0, is_liked: userLikeSet.has(p.id),
  }))

  const t = topic as Topic

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-muted-foreground mb-8 font-mono tracking-wider uppercase">
        <Link href="/" className="hover:text-primary transition-colors">← Accueil</Link>
        {t.category && <><span>/</span><Link href={`/c/${t.category.slug}`} className="hover:text-primary transition-colors">{t.category.name}</Link></>}
      </nav>

      {/* Topic Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          {t.is_pinned && <Badge variant="outline" className="rounded-full text-[9px] border-primary/30 text-primary">Épinglé</Badge>}
          {t.is_locked && <Badge variant="outline" className="rounded-full text-[9px]">Fermé</Badge>}
          {t.category && (
            <Badge className="rounded-full text-[9px] font-medium" style={{ background: `${t.category.color}18`, color: t.category.color }}>
              {t.category.name}
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter leading-[1.05] mb-5">
          {t.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Avatar className="size-6 ring-1 ring-border"><AvatarFallback className="text-[9px] bg-muted">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</AvatarFallback></Avatar>
          <span className="text-foreground font-medium">{t.author?.display_name || t.author?.username}</span>
          <Separator orientation="vertical" className="h-3 bg-border" />
          <TimeAgo date={t.created_at} />
          <Separator orientation="vertical" className="h-3 bg-border" />
          <span className="font-mono tabular-nums">{t.view_count} vues</span>
          <Separator orientation="vertical" className="h-3 bg-border" />
          <span className="font-mono tabular-nums">{t.reply_count} réponses</span>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-0">
        {postsWithLikes.map((post, i) => (
          <div key={post.id} id={`post-${post.id}`} className={`py-6 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex gap-4">
              <Avatar className="size-9 ring-1 ring-border shrink-0 mt-0.5">
                <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                  {(post.author?.display_name || post.author?.username || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold">{post.author?.display_name || post.author?.username}</span>
                  <span className="text-[11px] text-muted-foreground font-mono"><TimeAgo date={post.created_at} /></span>
                  {post.is_edited && <span className="text-[10px] text-muted-foreground italic">modifié</span>}
                </div>
                <div className="prose-4by4" dangerouslySetInnerHTML={{ __html: post.content }} />
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                  <LikeButton post={post} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      <div className="mt-16">
        <Separator className="bg-border mb-8" />
        {!t.is_locked ? (
          <ReplyForm topicId={t.id} />
        ) : (
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">🔒 Cette discussion est fermée.</p>
          </div>
        )}
      </div>
    </div>
  )
}
