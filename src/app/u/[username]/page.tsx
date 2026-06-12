import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TimeAgo } from "@/components/TimeAgo"
import Link from "next/link"
import type { Profile, Topic } from "@/lib/types"
import { ScrollReveal } from "@/components/ScrollReveal"

const TIER: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#A8A8A8",
  gold: "#FFB800",
  diamond: "#56D4FF",
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // ── Profile ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()
  if (!profile) notFound()
  const p = profile as Profile

  // ── Auth ──
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === p.id

  // ── Stats ──
  const { count: topicCount } = await supabase
    .from("topics")
    .select("*", { count: "exact", head: true })
    .eq("author_id", p.id)
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", p.id)

  // ── Topics ──
  const { data: topics } = await supabase
    .from("topics")
    .select(
      `*, author:profiles!topics_author_id_fkey(*), category:categories(*), last_reply_author:profiles!topics_last_reply_by_fkey(*)`
    )
    .eq("author_id", p.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .throwOnError()

  // ── Trophies ──
  const { data: userTrophies } = await supabase
    .from("user_trophies")
    .select(`*, trophy:trophies(*)`)
    .eq("user_id", p.id)
    .order("earned_at", { ascending: false })
  const { count: allTrophyCount } = await supabase
    .from("trophies")
    .select("*", { count: "exact", head: true })
  const earnedCount = userTrophies?.length || 0
  const totalTrophies = allTrophyCount || 14

  // ── Follow status ──
  let isFollowing = false
  if (user && user.id !== p.id) {
    try {
      const { data: followRow } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", p.id)
        .single()
      isFollowing = !!followRow
    } catch {
      // follows table may not exist yet
    }
  }

  const initials = (p.display_name || p.username)[0].toUpperCase()

  const stats = [
    { label: "Sujets", value: (topicCount || 0).toLocaleString() },
    { label: "Messages", value: (postCount || 0).toLocaleString() },
    { label: "Likes reçus", value: (p.like_count || 0).toLocaleString() },
    { label: "Trophées", value: `${earnedCount}/${totalTrophies}` },
  ]

  return (
    <div>
      {/* ═══════════════════════════════════════
          BANNER — full-bleed, gradient + noise
          ═══════════════════════════════════════ */}
      <div
        className="relative h-56 sm:h-72 overflow-hidden"
        style={
          p.banner_url
            ? { background: `url(${p.banner_url}) center/cover no-repeat` }
            : undefined
        }
      >
        {/* Gradient veil */}
        <div
          className="absolute inset-0"
          style={{
            background: p.banner_url
              ? "linear-gradient(180deg, rgba(12,13,16,0.25) 0%, rgba(12,13,16,0.88) 95%)"
              : "linear-gradient(135deg, rgba(255,77,28,0.09) 0%, rgba(26,27,32,0.7) 45%, rgba(0,212,170,0.05) 100%)",
          }}
        />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Fade-to-background at bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#0C0D10] via-[#0C0D10]/70 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          PROFILE CARD — overlaps banner
          ═══════════════════════════════════════ */}
      <div className="container-fluid content-constrain -mt-20 relative z-10">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-10">
            {/* ── Avatar ── */}
            <div className="size-28 sm:size-32 rounded-full ring-4 ring-[#0C0D10] shadow-2xl flex-shrink-0 overflow-hidden bg-card">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.display_name || p.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground bg-primary/10">
                  {initials}
                </div>
              )}
            </div>

            {/* ── Identity block ── */}
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h1
                  className="font-display text-3xl sm:text-4xl font-bold tracking-tight"
                  style={{ color: p.title_color || undefined }}
                >
                  {p.display_name || p.username}
                </h1>

                {/* Follow / Edit button */}
                {isOwnProfile ? (
                  <Link href={`/u/${p.username}/edit`}>
                    <Button
                      variant="outline"
                      size="default"
                      className="rounded-lg text-xs font-semibold h-9 px-4 border-border hover:bg-muted"
                    >
                      Modifier
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    size="default"
                    className={`rounded-lg text-xs font-semibold h-9 px-4 ${
                      isFollowing
                        ? "bg-primary hover:bg-primary/90"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {isFollowing ? "Abonné" : "Suivre"}
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground font-mono mt-1">
                @{p.username}
              </p>

              {p.bio && (
                <p className="text-foreground/70 mt-4 max-w-xl leading-relaxed text-[15px]">
                  {p.bio}
                </p>
              )}

              {/* Chips row */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {p.location && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-card border border-border rounded-full px-3 py-1">
                    📍 {p.location}
                  </span>
                )}
                {p.website && (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-secondary/80 transition-colors font-mono bg-card border border-border rounded-full px-3 py-1"
                  >
                    🔗 {new URL(p.website).hostname}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-card border border-border rounded-full px-3 py-1">
                  📅 Inscrit <TimeAgo date={p.created_at} />
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════
            STATS BAR — horizontal row with dividers
            ═══════════════════════════════════════ */}
        <ScrollReveal delay={0.1}>
          <div className="panel p-0 mb-12 overflow-hidden">
            <div className="flex divide-x divide-border">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 py-5 px-6 text-center"
                >
                  <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════
            TROPHIES SHOWCASE
            ═══════════════════════════════════════ */}
        <ScrollReveal delay={0.15}>
          <section className="mb-12">
            <h2 className="font-display text-lg font-bold mb-4 tracking-tight">
              🏆 Trophées
            </h2>
            {userTrophies && userTrophies.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {userTrophies.map((x: any) => {
                  const tier: string = x.trophy?.tier || "bronze"
                  const tierColor = TIER[tier] || "#CD7F32"
                  return (
                    <div
                      key={x.id}
                      className="panel px-4 py-3 flex items-center gap-3 transition-all hover:border-border hover:-translate-y-0.5"
                      style={{
                        borderLeftWidth: "3px",
                        borderLeftColor: tierColor,
                      }}
                    >
                      <span className="text-xl">
                        {x.trophy?.icon || "🏆"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {x.trophy?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">
                          {tier}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="panel p-10 text-center">
                <p className="text-3xl mb-3 opacity-40">🏆</p>
                <p className="text-muted-foreground text-sm font-medium">
                  Aucun trophée pour le moment.
                </p>
                <p className="text-muted-foreground/60 text-xs mt-1.5">
                  Participe aux discussions pour en débloquer&nbsp;!
                </p>
              </div>
            )}
          </section>
        </ScrollReveal>

        {/* ═══════════════════════════════════════
            TOPICS TABLE
            ═══════════════════════════════════════ */}
        <ScrollReveal delay={0.2}>
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Sujets créés
              </h2>
              {topics && topics.length > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  {topics.length} sujet{topics.length !== 1 ? "s" : ""}
                </span>
              )}
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
                  {topics && topics.length > 0 ? (
                    (topics as Topic[]).map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ring-1 ring-border">
                            {(
                              t.author?.display_name ||
                              t.author?.username ||
                              "?"
                            )[0].toUpperCase()}
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/t/${t.slug}`}
                            className="font-semibold hover:text-primary transition-colors truncate block"
                          >
                            {t.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            {t.category && (
                              <span style={{ color: t.category.color }}>
                                {t.category.name}
                              </span>
                            )}
                            {t.category && <span>·</span>}
                            <TimeAgo date={t.created_at} />
                          </div>
                        </td>
                        <td className="col-stats">
                          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                            <span>{t.reply_count} rép.</span>
                            <span>{t.view_count} vues</span>
                          </div>
                        </td>
                        <td className="col-last">
                          {t.last_reply_author ? (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                                {(
                                  t.last_reply_author.display_name ||
                                  t.last_reply_author.username ||
                                  "?"
                                )[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="truncate block text-muted-foreground">
                                  {t.last_reply_author.display_name ||
                                    t.last_reply_author.username}
                                </span>
                                <span className="text-muted-foreground/60">
                                  <TimeAgo date={t.last_reply_at!} />
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              <TimeAgo date={t.created_at} />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-16 text-muted-foreground"
                      >
                        Aucun sujet pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </ScrollReveal>

        {/* Bottom breathing room */}
        <div className="h-24" />
      </div>
    </div>
  )
}
