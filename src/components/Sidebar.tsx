import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Profile, Category } from "@/lib/types"

export async function Sidebar() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").throwOnError()
  const { count: tc } = await supabase.from("topics").select("*", { count: "exact", head: true })
  const { count: pc } = await supabase.from("posts").select("*", { count: "exact", head: true })
  const { count: uc } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).single() : { data: null }
  const p = profile as Profile | null

  return (
    <aside className="hidden lg:block w-52 shrink-0 py-4 px-3 space-y-5">
      {/* User */}
      {user && p ? (
        <div className="card-panel p-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <Link href={`/u/${p.username}`}>
              <Avatar className="size-9 ring-1 ring-border hover:ring-primary/40 transition-all">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">{(p.display_name || p.username)[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <Link href={`/u/${p.username}`} className="text-[13px] font-semibold truncate block">{p.display_name || p.username}</Link>
              <span className="text-[10px] text-muted-foreground font-mono">@{p.username}</span>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-mono text-muted-foreground">
            <span>{p.post_count || 0} msg</span>
            <span>{p.trophy_count || 0} 🏆</span>
          </div>
          <Link href="/new"><Button size="sm" className="w-full rounded-lg bg-primary hover:bg-primary/90 text-xs h-8 font-semibold">+ Nouveau sujet</Button></Link>
        </div>
      ) : (
        <div className="card-panel p-3 text-center">
          <Link href="/login"><Button variant="outline" size="sm" className="w-full rounded-lg text-xs h-8 border-border">Connexion</Button></Link>
        </div>
      )}

      {/* Categories */}
      <nav>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 font-mono">Catégories</h3>
        <div className="space-y-0.5">
          {(categories as Category[]).map(c => (
            <Link key={c.id} href={`/c/${c.slug}`}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-muted transition-colors">
              <span className="truncate">{c.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{c.topic_count}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Stats */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 font-mono">Forum</h3>
        <div className="text-[12px] text-muted-foreground space-y-1">
          {[{ l: "Sujets", v: tc || 0 }, { l: "Messages", v: pc || 0 }, { l: "Membres", v: uc || 0 }].map(s => (
            <div key={s.l} className="flex justify-between"><span>{s.l}</span><span className="font-mono tabular-nums">{s.v}</span></div>
          ))}
        </div>
      </div>
    </aside>
  )
}
