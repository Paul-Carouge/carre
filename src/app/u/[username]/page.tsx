import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"
import { TimeAgo } from "@/components/TimeAgo"

const TIER: Record<string, string> = { bronze: "#CD7F32", silver: "#A8A8A8", gold: "#FFB800", diamond: "#56D4FF" }

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()
  if (!profile) notFound()
  const p = profile as Profile

  const { count: tc } = await supabase.from("topics").select("*", { count: "exact", head: true }).eq("author_id", p.id)
  const { count: pc } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", p.id)

  const { data: topics } = await supabase.from("topics")
    .select(`*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`)
    .eq("author_id", p.id).order("created_at", { ascending: false }).limit(15).throwOnError()

  const { data: ut } = await supabase.from("user_trophies")
    .select(`*, trophy:trophies(*)`).eq("user_id", p.id).order("earned_at", { ascending: false })
  const { data: at } = await supabase.from("trophies").select("*")
  const earned = ut?.length || 0; const total = at?.length || 14

  return (
    <div>
      {/* Banner */}
      <div className="h-36 sm:h-48 bg-gradient-to-br from-primary/20 via-accent to-secondary/10 relative overflow-hidden">
        {p.banner_url && <img src={p.banner_url} alt="" className="w-full h-full object-cover opacity-40" />}
      </div>

      <div className="px-4 sm:px-6 -mt-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <Avatar className="size-20 sm:size-24 ring-3 ring-background shadow-xl">
            <AvatarImage src={p.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xl font-bold text-muted-foreground">{(p.display_name || p.username)[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <h1 className="font-display text-2xl" style={{ color: p.title_color || 'var(--foreground)' }}>{p.display_name || p.username}</h1>
            <p className="text-[13px] text-muted-foreground font-mono">@{p.username}</p>
            {p.bio && <p className="text-[13px] text-foreground/70 mt-2 max-w-lg">{p.bio}</p>}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground font-mono">
              {p.location && <span>📍 {p.location}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noopener" className="text-secondary hover:underline">🔗 Site</a>}
              <span>Inscrit <TimeAgo date={p.created_at} /></span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden mb-6">
          {[{ l: "Sujets", v: tc || 0 }, { l: "Messages", v: pc || 0 }, { l: "Likes", v: p.like_count || 0 }, { l: "Trophées", v: `${earned}/${total}` }].map(s => (
            <div key={s.l} className="bg-card p-3 text-center">
              <p className="font-display text-lg font-bold">{s.v}</p>
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Trophies */}
        {ut && ut.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-base font-bold mb-3">Trophées</h2>
            <div className="flex flex-wrap gap-1.5">
              {ut.map((x: any) => (
                <div key={x.id} className="card-panel px-3 py-1.5 flex items-center gap-2 text-[12px]" style={{ borderColor: TIER[x.trophy?.tier] || '#CD7F32' }}>
                  <span>{x.trophy?.icon || "🏆"}</span><span className="font-medium">{x.trophy?.name}</span>
                  <Badge variant="outline" className="text-[9px] rounded-sm px-1 h-4" style={{ borderColor: TIER[x.trophy?.tier], color: TIER[x.trophy?.tier] }}>{x.trophy?.tier}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        <h2 className="font-display text-base font-bold mb-3">Sujets créés</h2>
        <div className="card-panel overflow-hidden">
          {topics && topics.length > 0 ? (topics as Topic[]).map(t => (
            <div key={t.id} className="topic-row px-4">
              <div className="min-w-0">
                <Link href={`/t/${t.slug}`} className="text-[13px] font-semibold hover:text-primary transition-colors truncate">{t.title}</Link>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  {t.category && <span style={{ color: t.category.color }}>{t.category.name}</span>}{t.category && <span>·</span>}<TimeAgo date={t.created_at} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono"><span>{t.reply_count} rép.</span><span>{t.view_count} vues</span></div>
              <div className="last-post-col" />
            </div>
          )) : <div className="p-6 text-center text-sm text-muted-foreground">Aucun sujet.</div>}
        </div>
      </div>
    </div>
  )
}
