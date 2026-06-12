import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/TimeAgo"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"

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
      <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/15 via-accent to-secondary/10 relative overflow-hidden">
        {p.banner_url && <img src={p.banner_url} alt="" className="w-full h-full object-cover opacity-30" />}
      </div>

      <div className="container-fluid content-constrain -mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
          <div className="size-24 sm:size-28 rounded-full bg-muted ring-4 ring-background shadow-2xl flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {(p.display_name || p.username)[0].toUpperCase()}
          </div>
          <div className="pb-1">
            <h1 className="font-display text-3xl font-bold" style={{ color: p.title_color || 'var(--text-primary)' }}>{p.display_name || p.username}</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">@{p.username}</p>
            {p.bio && <p className="text-foreground/70 mt-3 max-w-xl leading-relaxed">{p.bio}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-mono">
              {p.location && <span>📍 {p.location}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noopener" className="text-secondary hover:underline">🔗 Site</a>}
              <span>Inscrit <TimeAgo date={p.created_at} /></span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {[{ l: "Sujets", v: tc || 0 }, { l: "Messages", v: pc || 0 }, { l: "Likes", v: p.like_count || 0 }, { l: "Trophées", v: `${earned}/${total}` }].map(s => (
            <div key={s.l} className="panel p-4 text-center">
              <p className="font-display text-2xl font-bold">{s.v}</p>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Trophies */}
        {ut && ut.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-bold mb-3">Trophées</h2>
            <div className="flex flex-wrap gap-2">
              {ut.map((x: any) => (
                <div key={x.id} className="panel px-3 py-1.5 flex items-center gap-2 text-sm" style={{ borderColor: TIER[x.trophy?.tier] || '#CD7F32' }}>
                  <span>{x.trophy?.icon || "🏆"}</span><span className="font-medium">{x.trophy?.name}</span>
                  <Badge variant="outline" className="text-[9px] rounded-sm px-1 h-4" style={{ borderColor: TIER[x.trophy?.tier], color: TIER[x.trophy?.tier] }}>{x.trophy?.tier}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        <h2 className="font-display text-lg font-bold mb-3">Sujets créés</h2>
        <div className="panel overflow-hidden glow-orange">
          <table className="topic-table">
            <thead><tr><th className="col-avatar"></th><th className="col-title">Sujet</th><th className="col-stats">Stats</th><th className="col-last"></th></tr></thead>
            <tbody>
              {topics && topics.length > 0 ? (topics as Topic[]).map(t => (
                <tr key={t.id}>
                  <td><div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ring-1 ring-border">{(t.author?.display_name || t.author?.username || "?")[0].toUpperCase()}</div></td>
                  <td>
                    <Link href={`/t/${t.slug}`} className="font-semibold hover:text-primary transition-colors truncate">{t.title}</Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      {t.category && <span style={{ color: t.category.color }}>{t.category.name}</span>}{t.category && <span>·</span>}<TimeAgo date={t.created_at} />
                    </div>
                  </td>
                  <td className="col-stats"><div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-mono tabular-nums"><span>{t.reply_count} rép.</span><span>{t.view_count} vues</span></div></td>
                  <td className="col-last" />
                </tr>
              )) : <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Aucun sujet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
