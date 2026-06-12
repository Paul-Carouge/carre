import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#A8A8A8", gold: "#FFB800", diamond: "#56D4FF",
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()
  if (!profile) notFound()
  const p = profile as Profile & { banner_url?: string; post_count?: number; like_count?: number; trophy_count?: number; website?: string; location?: string }

  // Stats
  const { count: topicCount } = await supabase.from("topics").select("*", { count: "exact", head: true }).eq("author_id", p.id)
  const { count: postCount } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", p.id)
  const { count: likeCount } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", p.id)

  // Recent topics
  const { data: topics } = await supabase.from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .eq("author_id", p.id).order("created_at", { ascending: false }).limit(10).throwOnError()

  // Recent posts
  const { data: recentPosts } = await supabase.from("posts")
    .select(`*, topic:topics(id, title, slug), author:profiles(*)`)
    .eq("author_id", p.id).order("created_at", { ascending: false }).limit(10).throwOnError()

  // Trophies
  const { data: userTrophies } = await supabase.from("user_trophies")
    .select(`*, trophy:trophies(*)`).eq("user_id", p.id).order("earned_at", { ascending: false })

  // Trophy stats
  const { data: allTrophies } = await supabase.from("trophies").select("*")
  const earned = userTrophies?.length || 0
  const total = allTrophies?.length || 14

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Banner ── */}
      <div className="h-40 sm:h-56 bg-gradient-to-br from-secondary via-secondary to-primary/20 relative overflow-hidden">
        {p.banner_url && <img src={p.banner_url} alt="" className="w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="px-6 -mt-16 relative z-10">
        {/* ── Avatar + Identity ── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
          <Avatar className="size-24 sm:size-28 ring-4 ring-background shadow-lg">
            <AvatarImage src={p.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-2xl font-extrabold text-secondary-foreground">
              {(p.display_name || p.username)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tighter"
              style={{ color: p.title_color || undefined }}>
              {p.display_name || p.username}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">@{p.username}</p>
            {p.bio && <p className="text-sm text-foreground/80 mt-2 max-w-lg leading-relaxed">{p.bio}</p>}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-mono">
              {p.location && <span>📍 {p.location}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noopener" className="text-primary hover:underline">🔗 Site</a>}
              <span>Membre <TimeAgo date={p.created_at} /></span>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-4 gap-1 bg-border rounded-xl overflow-hidden mb-8">
          {[
            { label: "Sujets", value: topicCount || 0 },
            { label: "Messages", value: postCount || 0 },
            { label: "Likes reçus", value: likeCount || 0 },
            { label: "Trophées", value: `${earned}/${total}` },
          ].map((s) => (
            <div key={s.label} className="bg-card p-4 text-center">
              <p className="font-display text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Trophies ── */}
        {userTrophies && userTrophies.length > 0 && (
          <section className="mb-10">
            <p className="section-number mb-3">Trophées</p>
            <div className="flex flex-wrap gap-2">
              {userTrophies.map((ut: any) => (
                <div key={ut.id} className="panel-offwhite rounded-full px-3 py-1.5 flex items-center gap-2 text-xs hover-lift"
                  style={{ borderColor: TIER_COLORS[ut.trophy?.tier] || '#CD7F32' }}>
                  <span>{ut.trophy?.icon || "🏆"}</span>
                  <span className="font-medium">{ut.trophy?.name}</span>
                  <Badge variant="outline" className="text-[9px] rounded-full px-1.5 h-4"
                    style={{ borderColor: TIER_COLORS[ut.trophy?.tier], color: TIER_COLORS[ut.trophy?.tier] }}>
                    {ut.trophy?.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        <Separator className="mb-10" />

        {/* ── Topics ── */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-bold tracking-tight mb-5">Sujets créés</h2>
          {topics && topics.length > 0 ? (
            <div className="divide-y divide-border">
              {(topics as Topic[]).map(t => (
                <Link key={t.id} href={`/t/${t.slug}`}
                  className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{t.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      {t.category && <span style={{ color: t.category.color }}>{t.category.name}</span>}
                      {t.category && <span>·</span>}
                      <TimeAgo date={t.created_at} />
                      <span>·</span>
                      <span className="font-mono">{t.reply_count} réponses</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground panel-offwhite rounded-xl p-6 text-center">Aucun sujet créé.</p>}
        </section>

        {/* ── Recent Posts ── */}
        {recentPosts && recentPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-lg font-bold tracking-tight mb-5">Messages récents</h2>
            <div className="space-y-2">
              {recentPosts.map((post: any) => (
                <Link key={post.id} href={`/t/${post.topic?.slug}#post-${post.id}`}
                  className="block panel-offwhite rounded-lg px-4 py-3 hover-lift transition-all text-sm">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 font-mono">
                    <span className="font-medium text-foreground truncate">{post.topic?.title || "Sujet supprimé"}</span>
                    <span>·</span>
                    <TimeAgo date={post.created_at} />
                  </div>
                  <p className="text-muted-foreground truncate text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content.substring(0, 180) }} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
