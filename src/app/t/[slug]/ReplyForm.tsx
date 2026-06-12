"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function ReplyForm({ topicId }: { topicId: string }) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Vous devez être connecté pour répondre.")
      setSubmitting(false)
      return
    }

    const { error: postError } = await supabase.from("posts").insert({
      topic_id: topicId,
      author_id: user.id,
      content: content.trim(),
    })

    if (postError) {
      setError(postError.message)
      setSubmitting(false)
      return
    }

    // Update topic reply count and last_reply
    await supabase
      .from("topics")
      .update({
        reply_count: undefined, // will be calculated
        last_reply_at: new Date().toISOString(),
        last_reply_by: user.id,
      })
      .eq("id", topicId)

    setContent("")
    setSubmitting(false)
    router.refresh()
  }

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText =
      content.substring(0, start) + before + selected + after + content.substring(end)

    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      )
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-5">
      <h3 className="font-display text-lg font-semibold mb-4">Votre réponse</h3>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-3 pb-3 border-b border-white/[0.05]">
        <button
          type="button"
          onClick={() => insertMarkdown("**", "**")}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors font-bold"
          title="Gras"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("*", "*")}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors italic"
          title="Italique"
        >
          I
        </button>
        <div className="w-px h-4 bg-white/[0.08] mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown("`", "`")}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors font-mono"
          title="Code"
        >
          {"<>"}
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("[", "](url)")}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors"
          title="Lien"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("\n> ")}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors"
          title="Citation"
        >
          ❝
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre réponse..."
        rows={5}
        className="w-full bg-transparent text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none text-sm leading-relaxed mb-4"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          Markdown supporté — **gras**, *italique*, `code`, [lien](url)
        </span>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn-primary text-sm disabled:opacity-40"
        >
          {submitting ? "Envoi..." : "Publier"}
        </button>
      </div>
    </form>
  )
}
