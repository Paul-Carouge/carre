import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TopicCard } from "@/components/TopicCard"
import { UserAvatar } from "@/components/UserAvatar"
import { TimeAgo } from "@/components/TimeAgo"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()

  if (!profile) notFound()

  const p = profile as Profile

  // Get user's topics
  const { data: topics } = await supabase
    .from("topics")
    .select(`
      *,
      author:profiles!topics_author_id_fkey(*),
      category:categories(*),
      last_reply_author:profiles!topics_last_reply_by_fkey(*)
    `)
    .eq("author_id", p.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .throwOnError()

  // Get user's recent posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select(`
      *,
      topic:topics(id, title, slug),
      author:profiles(*)
    `)
    .eq("author_id", p.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .throwOnError()

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-8">
        <Link href="/" className="hover:text-or transition-colors">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-text-secondary">@{p.username}</span>
      </nav>

      {/* Profile Header */}
      <div className="glass rounded-xl p-6 mb-10 accent-glow">
        <div className="flex items-start gap-5">
          <UserAvatar user={p} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold">
              {p.display_name || p.username}
            </h1>
            <p className="text-text-tertiary text-sm mt-0.5">@{p.username}</p>
            {p.bio && (
              <p className="text-text-secondary text-sm mt-3 leading-relaxed max-w-lg">
                {p.bio}
              </p>
            )}
            <p className="text-xs text-text-tertiary mt-3">
              Membre depuis <TimeAgo date={p.created_at} />
            </p>
          </div>
        </div>
      </div>

      {/* Topics */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold mb-5">
          Sujets créés ({(topics as Topic[]).length})
        </h2>
        {topics && topics.length > 0 ? (
          <div className="space-y-3">
            {(topics as Topic[]).map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <p className="text-text-tertiary text-sm glass rounded-xl p-6 text-center">
            Aucun sujet créé pour le moment.
          </p>
        )}
      </section>

      {/* Recent Posts */}
      {recentPosts && recentPosts.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-5">
            Messages récents
          </h2>
          <div className="space-y-2">
            {recentPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/t/${post.topic?.slug}#post-${post.id}`}
                className="block glass rounded-lg px-4 py-3 glass-hover transition-all text-sm"
              >
                <div className="flex items-center gap-2 text-text-tertiary text-xs mb-1">
                  <span>Dans</span>
                  <span className="text-text-secondary font-medium truncate">
                    {post.topic?.title || "Sujet supprimé"}
                  </span>
                  <span>·</span>
                  <TimeAgo date={post.created_at} />
                </div>
                <p className="text-text-secondary truncate">
                  {post.content.substring(0, 150)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
