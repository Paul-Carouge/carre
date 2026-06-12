"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function FollowButton({ targetId }: { targetId: string }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return }
      setUserId(data.user.id)
      if (data.user.id === targetId) { setLoading(false); return }
      try {
        const { data: f } = await supabase.from("follows").select("*")
          .eq("follower_id", data.user.id).eq("following_id", targetId).maybeSingle()
        setIsFollowing(!!f)
      } catch { /* table may not exist */ }
      setLoading(false)
    })
  }, [targetId])

  const toggle = useCallback(async () => {
    if (!userId || loading) return
    setLoading(true)
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId)
        setIsFollowing(false)
      } else {
        await supabase.from("follows").insert({ follower_id: userId, following_id: targetId })
        setIsFollowing(true)
      }
    } catch { /* table may not exist */ }
    setLoading(false)
  }, [userId, targetId, isFollowing, loading, supabase])

  if (loading) return <Button variant="outline" size="sm" disabled className="rounded-lg text-xs h-9">…</Button>
  if (!userId || userId === targetId) return null

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg text-xs h-9 font-semibold ${isFollowing ? "bg-primary hover:bg-primary/90" : "hover:border-primary/50"}`}
    >
      {isFollowing ? "Abonné" : "Suivre"}
    </Button>
  )
}
