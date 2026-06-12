"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({ data }) => { if (data) setCategories(data as Category[]) }) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true); setError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Connectez-vous."); setSubmitting(false); return }
    const slug = slugify(title, { lower: true, strict: true })
    const { data: topic, error: te } = await supabase.from("topics").insert({
      title: title.trim(), slug, category_id: categoryId || null, author_id: user.id, reply_count: 0, last_reply_at: new Date().toISOString()
    }).select().single()
    if (te) { setError(te.message); setSubmitting(false); return }
    const { error: pe } = await supabase.from("posts").insert({ topic_id: topic.id, author_id: user.id, content: content.trim() })
    if (pe) { setError(pe.message); setSubmitting(false); return }
    router.push(`/t/${slug}`)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Forum</p>
      <h1 className="font-display text-3xl font-bold tracking-tighter mb-2">Nouveau sujet</h1>
      <p className="text-sm text-muted-foreground mb-10">Lancez une discussion.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg px-4 py-3">{error}</div>}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2 font-mono uppercase tracking-wider">Catégorie</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Sans catégorie</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2 font-mono uppercase tracking-wider">Titre</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required minLength={5}
            placeholder="Titre de la discussion" className="bg-muted border-border text-sm h-10 rounded-xl" />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2 font-mono uppercase tracking-wider">Message</label>
          <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={6}
            placeholder="Votre message… (Markdown supporté)" className="bg-muted border-border text-sm rounded-xl resize-none" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm">
            {submitting ? "…" : "Publier"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="rounded-full text-muted-foreground text-sm">
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
