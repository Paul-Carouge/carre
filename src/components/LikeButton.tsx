"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/lib/types"

export function LikeButton({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.is_liked || false)
  const [count, setCount] = useState(post.like_count || 0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLike = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      setLiked(false); setCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id })
      setLiked(true); setCount(c => c + 1)
    }
    setLoading(false)
  }, [liked, post.id, supabase])

  return (
    <button onClick={handleLike} disabled={loading}
      className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
      <svg className="size-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  )
}
