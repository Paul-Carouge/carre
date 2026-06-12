"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { TimeAgo } from "@/components/TimeAgo"
import Link from "next/link"
import type { Notification } from "@/lib/types"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const supabase = createClient()

  const fetchNotifs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const { data } = await supabase.from("notifications")
        .select(`*, actor:profiles!notifications_actor_id_fkey(*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30)
      if (data) {
        setNotifications(data as Notification[])
        setUnread(data.filter((n: any) => !n.read).length)
      }
    } catch { /* table may not exist yet */ }
  }, [supabase])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (id: string) => {
    try { await supabase.from("notifications").update({ read: true }).eq("id", id) } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(p => Math.max(0, p - 1))
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try { await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false) } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const getNotifText = (n: Notification) => {
    const name = n.actor?.display_name || n.actor?.username || "Quelqu'un"
    switch (n.type) {
      case "like": return <>{name} a aimé votre message</>
      case "reply": return <>{name} a répondu à votre discussion</>
      case "follow": return <>{name} vous suit</>
      case "trophy": return <>Vous avez débloqué un trophée</>
      default: return <>{name} a interagi avec vous</>
    }
  }

  const getNotifLink = (n: Notification) => {
    if (n.topic_id) return `/t/${n.topic_id}`
    if (n.actor?.username) return `/u/${n.actor.username}`
    return "#"
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifs() }}
        className="relative size-9 flex items-center justify-center rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-all">
        <svg className="size-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-[60]">
            <div className="panel border-border shadow-2xl shadow-black/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-display text-sm font-bold">Notifications</h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-secondary hover:underline font-mono">Tout lu</button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">Aucune notification.</p>
                ) : (
                  notifications.map(n => (
                    <Link key={n.id} href={getNotifLink(n)} onClick={() => { markRead(n.id); setOpen(false) }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                      <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 mt-0.5">
                        {n.type === "like" ? "❤️" : n.type === "reply" ? "💬" : n.type === "follow" ? "👤" : "🏆"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-relaxed ${!n.read ? "font-semibold" : ""}`}>{getNotifText(n)}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5"><TimeAgo date={n.created_at} /></p>
                      </div>
                      {!n.read && <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
