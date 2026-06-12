import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PostCard } from "@/components/PostCard"
import { UserAvatar } from "@/components/UserAvatar"
import { TimeAgo } from "@/components/TimeAgo"
import { ReplyForm } from "./ReplyForm"
import Link from "next/link"
import type { Post, Topic } from "@/lib/types"

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: topic } = await supabase
    .from("topics")
    .select(`
      *,
      author:profiles!topics_author_id_fkey(*),
      category:categories(*)
    `)
    .eq("slug", slug)
    .single()

  if (!topic) notFound()

  // Increment view count
  await supabase
    .from("topics")
    .update({ view_count: (topic as Topic).view_count + 1 })
    .eq("id", (topic as Topic).id)
    .throwOnError()

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*)
    `)
    .eq("topic_id", (topic as Topic).id)
    .order("created_at", { ascending: true })
    .throwOnError()

  // Get like counts for each post
  const postIds = (posts as Post[]).map((p) => p.id)
  const { data: likes } = await supabase
    .from("likes")
    .select("post_id")
    .in("post_id", postIds)

  const likeCounts = new Map<string, number>()
  likes?.forEach((l: any) => {
    likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1)
  })

  // Check if current user liked each post
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userLikes } = user
    ? await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds)
    : { data: [] }

  const userLikeSet = new Set(userLikes?.map((l: any) => l.post_id) || [])

  const postsWithLikes = (posts as Post[]).map((p) => ({
    ...p,
    like_count: likeCounts.get(p.id) || 0,
    is_liked: userLikeSet.has(p.id),
  }))

  const t = topic as Topic

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-8">
        <Link href="/" className="hover:text-or transition-colors">
          Accueil
        </Link>
        <span>/</span>
        {t.category && (
          <>
            <Link
              href={`/c/${t.category.slug}`}
              className="hover:text-or transition-colors"
            >
              {t.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-text-secondary truncate">{t.title}</span>
      </nav>

      {/* Topic Header */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {t.is_pinned && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-or bg-or-subtle px-2 py-0.5 rounded-full">
              Épinglé
            </span>
          )}
          {t.is_locked && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary bg-white/[0.04] px-2 py-0.5 rounded-full">
              Fermé
            </span>
          )}
          {t.category && (
            <span
              className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: t.category.color,
                background: `${t.category.color}15`,
              }}
            >
              {t.category.name}
            </span>
          )}
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4">
          {t.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-text-tertiary">
          <UserAvatar user={t.author!} size="sm" />
          <span className="text-text-secondary">
            {t.author?.display_name || t.author?.username}
          </span>
          <span>·</span>
          <TimeAgo date={t.created_at} />
          <span>·</span>
          <span>{t.view_count} vues</span>
          <span>·</span>
          <span>{t.reply_count} réponses</span>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-8">
        {postsWithLikes.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Reply Form */}
      {!t.is_locked && <ReplyForm topicId={t.id} />}

      {t.is_locked && (
        <div className="glass rounded-xl p-6 text-center text-text-secondary text-sm">
          🔒 Cette discussion est fermée. Impossible d'ajouter de nouvelles réponses.
        </div>
      )}
    </div>
  )
}
