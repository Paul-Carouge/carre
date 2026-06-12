import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Category } from "@/lib/types"

export async function Sidebar() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").throwOnError()
  const { count: topicCount } = await supabase.from("topics").select("*", { count: "exact", head: true })
  const { count: postCount } = await supabase.from("posts").select("*", { count: "exact", head: true })
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).single() : { data: null }

  return (
    <aside className="hidden lg:block w-56 shrink-0 border-r border-border p-4 space-y-5">
      {user && profile ? (
        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-8 ring-1 ring-border">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-muted text-[10px] font-bold">{(profile.display_name || profile.username)[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link href={`/u/${profile.username}`} className="text-sm font-medium hover:underline truncate block">{profile.display_name || profile.username}</Link>
              <span className="text-[10px] text-muted-foreground font-mono">@{profile.username}</span>
            </div>
          </div>
          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
            <span>{profile.post_count || 0} msg</span>
            <span>{profile.trophy_count || 0} 🏆</span>
          </div>
          <Link href="/new">
            <Button size="sm" className="w-full rounded-md bg-primary hover:bg-primary/90 text-xs h-7">+ Nouveau sujet</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <Link href="/login"><Button variant="outline" size="sm" className="w-full rounded-md text-xs h-7">Connexion</Button></Link>
        </div>
      )}

      <nav>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 font-mono">Catégories</h3>
        <div className="space-y-0.5">
          {(categories as Category[]).map(cat => (
            <Link key={cat.id} href={`/c/${cat.slug}`}
              className="flex items-center justify-between px-2 py-1.5 rounded text-[13px] hover:bg-muted transition-colors">
              <span className="truncate">{cat.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono ml-1">{cat.topic_count}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 font-mono">Forum</h3>
        <div className="text-[12px] text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>Sujets</span><span className="font-mono tabular-nums">{topicCount || 0}</span></div>
          <div className="flex justify-between"><span>Messages</span><span className="font-mono tabular-nums">{postCount || 0}</span></div>
          <div className="flex justify-between"><span>Membres</span><span className="font-mono tabular-nums">{userCount || 0}</span></div>
        </div>
      </div>
    </aside>
  )
}
