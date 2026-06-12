"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { RichEditor } from "@/components/RichEditor"

export function ReplyForm({ topicId }: { topicId: string }) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || content === "<p></p>") return
    setSubmitting(true); setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Connectez-vous."); setSubmitting(false); return }
    const { error: pe } = await supabase.from("posts").insert({ topic_id: topicId, author_id: user.id, content })
    if (pe) { setError(pe.message); setSubmitting(false); return }
    await supabase.from("topics").update({ reply_count: undefined, last_reply_at: new Date().toISOString(), last_reply_by: user.id }).eq("id", topicId)
    setContent(""); setSubmitting(false); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-display text-lg font-bold mb-4">Répondre</h3>
      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] rounded-lg px-3 py-2 mb-3">{error}</div>}
      <RichEditor content={content} onChange={setContent} placeholder="Votre réponse…" />
      <div className="flex justify-end mt-3">
        <Button type="submit" disabled={submitting || !content.trim()} size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-xs h-8 font-semibold">{submitting ? "…" : "Publier"}</Button>
      </div>
    </form>
  )
}
