import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()
  if (!profile) notFound()
  const p = profile as Profile

  const { data: topics } = await supabase
    .from("topics").select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .eq("author_id", p.id).order("created_at", { ascending: false }).limit(20).throwOnError()

  const { data: recentPosts } = await supabase
    .from("posts").select(`*, topic:topics(id, title, slug), author:profiles(*)`)
    .eq("author_id", p.id).order("created_at", { ascending: false }).limit(10).throwOnError()

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-[11px] text-muted-foreground mb-8 font-mono tracking-wider uppercase">
        <Link href="/" className="hover:text-primary transition-colors">← Accueil</Link>
        <span>/</span>
        <span className="text-foreground">@{p.username}</span>
      </nav>

      <div className="glass-panel rounded-xl p-6 glow-lime mb-12">
        <div className="flex items-start gap-5">
          <Avatar className="size-16 ring-1 ring-border"><AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">{(p.display_name || p.username)[0].toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{p.display_name || p.username}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{p.username}</p>
            {p.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{p.bio}</p>}
            <p className="text-[11px] text-muted-foreground mt-3 font-mono">Membre <TimeAgo date={p.created_at} /></p>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold tracking-tight mb-5">Sujets ({(topics as Topic[]).length})</h2>
        {topics && topics.length > 0 ? (
          <div className="space-y-px">
            {(topics as Topic[]).map(topic => (
              <Link key={topic.id} href={`/t/${topic.slug}`} className="flex items-center gap-4 group py-3.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{topic.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    {topic.category && <span style={{ color: topic.category.color }}>{topic.category.name}</span>}
                    {topic.category && <span>·</span>}
                    <TimeAgo date={topic.created_at} />
                    <span>·</span>
                    <span className="font-mono">{topic.reply_count} réponses</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm glass-panel rounded-xl p-6 text-center">Aucun sujet créé.</p>}
      </section>

      {recentPosts && recentPosts.length > 0 && (
        <section>
          <Separator className="bg-border mb-8" />
          <h2 className="font-display text-lg font-bold tracking-tight mb-5">Messages récents</h2>
          <div className="space-y-2">
            {recentPosts.map((post: any) => (
              <Link key={post.id} href={`/t/${post.topic?.slug}#post-${post.id}`}
                className="block glass-panel rounded-lg px-4 py-3 hover-lift transition-all text-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 font-mono">
                  <span className="text-foreground font-medium truncate">{post.topic?.title || "Sujet supprimé"}</span>
                  <span>·</span>
                  <TimeAgo date={post.created_at} />
                </div>
                <p className="text-muted-foreground truncate text-xs">{post.content.substring(0, 150)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
