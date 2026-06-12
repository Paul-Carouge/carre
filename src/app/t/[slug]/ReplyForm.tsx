"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ReplyForm({ topicId }: { topicId: string }) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = (before: string, after = "") => {
    const ta = textareaRef.current; if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = content.substring(s, e)
    setContent(content.substring(0, s) + before + sel + after + content.substring(e))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length) }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true); setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Connectez-vous pour répondre."); setSubmitting(false); return }
    const { error: postError } = await supabase.from("posts").insert({ topic_id: topicId, author_id: user.id, content: content.trim() })
    if (postError) { setError(postError.message); setSubmitting(false); return }
    await supabase.from("topics").update({ reply_count: undefined, last_reply_at: new Date().toISOString(), last_reply_by: user.id }).eq("id", topicId)
    setContent(""); setSubmitting(false); router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-display text-lg font-bold tracking-tight mb-4">Répondre</h3>
      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg px-4 py-3 mb-4">{error}</div>}
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
        {[["**","**","B"],["*","*","I"],["`","`","</>"],["[","](url)","🔗"],["\n> ","","❝"]].map(([b,a,l]) => (
          <button key={l} type="button" onClick={() => insertMarkdown(b as string, a as string)}
            className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors font-mono">
            {l}
          </button>
        ))}
      </div>

      <Textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
        placeholder="Votre réponse..." rows={4}
        className="bg-transparent border-0 focus-visible:ring-0 text-sm resize-none placeholder:text-muted-foreground/50 mb-4 p-0" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">**gras** *italique* `code`</span>
        <Button type="submit" disabled={submitting || !content.trim()} size="sm"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-8">
          {submitting ? "Envoi…" : "Publier"}
        </Button>
      </div>
    </form>
  )
}
