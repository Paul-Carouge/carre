"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { RichEditor } from "@/components/RichEditor"
import { ScrollReveal, StaggerReveal } from "@/components/ScrollReveal"
import type { Category } from "@/lib/types"
import slugify from "slugify"
import { Sparkles, X, ChevronLeft, Send, Loader2 } from "lucide-react"

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

  const wordCount = content
    .replace(/<[^>]*>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const isValid = title.trim().length >= 5 && content.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("Vous devez être connecté pour publier.")
      setSubmitting(false)
      return
    }

    const slug = slugify(title, { lower: true, strict: true })

    const { data: topic, error: te } = await supabase
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

    if (te) {
      setError(te.message)
      setSubmitting(false)
      return
    }

    const { error: pe } = await supabase
      .from("posts")
      .insert({ topic_id: topic.id, author_id: user.id, content })

    if (pe) {
      setError(pe.message)
      setSubmitting(false)
      return
    }

    router.push(`/t/${slug}`)
  }

  return (
    <div className="container-fluid content-constrain py-12 max-w-3xl">
      {/* ── Hero ── */}
      <ScrollReveal>
        <div className="mb-14">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-foreground">
            Nouvelle discussion
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg">
            Partagez vos idées, posez vos questions, lancez le débat.
          </p>
        </div>
      </ScrollReveal>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Error Banner ── */}
        {error && (
          <ScrollReveal>
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
              <X className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          </ScrollReveal>
        )}

        {/* ── Category Chips ── */}
        <ScrollReveal delay={0.08}>
          <div className="panel p-6 rounded-xl shadow-sm border-border">
            <label className="block text-xs font-semibold text-muted-foreground mb-4 font-mono uppercase tracking-wider">
              Catégorie
            </label>
            <div className="flex flex-wrap gap-2.5">
              {/* No category chip */}
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${
                    categoryId === ""
                      ? "border-primary bg-primary/5 text-primary shadow-[0_0_0_1px_var(--accent-orange)]"
                      : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Sparkles className="size-3.5" />
                <span>Sans catégorie</span>
              </button>

              {/* Category chips */}
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${
                      categoryId === c.id
                        ? "border-primary bg-primary/5 text-primary shadow-[0_0_0_1px_var(--accent-orange)]"
                        : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground hover:bg-muted/50"
                    }
                  `}
                >
                  {c.icon && <span className="text-base leading-none">{c.icon}</span>}
                  <span>{c.name}</span>
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color || "#626368" }}
                  />
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── Title ── */}
        <ScrollReveal delay={0.12}>
          <div className="panel p-6 rounded-xl shadow-sm border-border">
            <label
              htmlFor="topic-title"
              className="block text-xs font-semibold text-muted-foreground mb-3 font-mono uppercase tracking-wider"
            >
              Titre
            </label>
            <input
              id="topic-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
              placeholder="Titre de votre discussion…"
              className="
                w-full bg-transparent text-xl sm:text-2xl font-display font-semibold
                placeholder:text-muted-foreground/30 focus:outline-none
                border-b-2 border-transparent focus:border-primary/30
                transition-colors duration-200 pb-3 pt-0.5
              "
            />
            {title.length > 0 && title.length < 5 && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Minimum 5 caractères ({title.length}/5)
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* ── Content ── */}
        <ScrollReveal delay={0.16}>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-3 font-mono uppercase tracking-wider">
              Message
            </label>
            <RichEditor
              content={content}
              onChange={setContent}
              placeholder="Écrivez votre message…"
            />
          </div>
        </ScrollReveal>

        {/* ── Action Bar ── */}
        <div className="sticky bottom-0 z-20 -mb-6 pb-8 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="panel p-4 rounded-xl shadow-lg border-border flex items-center justify-between gap-4">
            {/* Word count */}
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {wordCount > 0 ? `${wordCount} mot${wordCount > 1 ? "s" : ""}` : "Commencez à écrire…"}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="rounded-lg text-sm h-10 px-4 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Annuler
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-lg text-sm h-10 px-4 text-muted-foreground"
              >
                Brouillon
              </Button>

              <Button
                type="submit"
                disabled={!isValid || submitting}
                className="rounded-lg bg-primary hover:bg-primary/90 font-semibold text-sm h-10 px-6 gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publication…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
