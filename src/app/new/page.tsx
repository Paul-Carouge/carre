"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Category } from "@/lib/types"
import slugify from "slugify"

export default function NewTopicPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data as Category[])
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSubmitting(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Vous devez être connecté.")
      setSubmitting(false)
      return
    }

    const slug = slugify(title, { lower: true, strict: true })

    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .insert({
        title: title.trim(),
        slug,
        category_id: categoryId || null,
        author_id: user.id,
        reply_count: 0,
        last_reply_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (topicError) {
      setError(topicError.message)
      setSubmitting(false)
      return
    }

    // Create first post
    const { error: postError } = await supabase.from("posts").insert({
      topic_id: topic.id,
      author_id: user.id,
      content: content.trim(),
    })

    if (postError) {
      setError(postError.message)
      setSubmitting(false)
      return
    }

    router.push(`/t/${slug}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Nouveau sujet</h1>
        <p className="text-text-secondary text-sm">
          Créez une nouvelle discussion dans le forum.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Catégorie
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-or/30 transition-colors"
          >
            <option value="">Sans catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Titre
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-or/30 transition-colors"
            placeholder="Titre de votre discussion..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-or/30 transition-colors"
            placeholder="Contenu de votre message... (Markdown supporté)"
          />
          <p className="text-xs text-text-tertiary mt-1.5">
            **gras**, *italique*, `code`, [lien](url), &gt; citation
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="btn-primary text-sm disabled:opacity-40"
          >
            {submitting ? "Création..." : "Publier le sujet"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost text-sm"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
