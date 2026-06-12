"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichEditor } from "@/components/RichEditor"
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
    const { data: topic, error: te } = await supabase.from("topics").insert({ title: title.trim(), slug, category_id: categoryId || null, author_id: user.id, reply_count: 0, last_reply_at: new Date().toISOString() }).select().single()
    if (te) { setError(te.message); setSubmitting(false); return }
    const { error: pe } = await supabase.from("posts").insert({ topic_id: topic.id, author_id: user.id, content })
    if (pe) { setError(pe.message); setSubmitting(false); return }
    router.push(`/t/${slug}`)
  }

  return (
    <div className="py-6 px-4 sm:px-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-6">Nouveau sujet</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[12px] rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-[0.1em]">Catégorie</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Sans catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-[0.1em]">Titre</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required minLength={5} placeholder="Titre de la discussion" className="bg-card border-border text-[13px] h-10 rounded-lg" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-[0.1em]">Message</label>
          <RichEditor content={content} onChange={setContent} placeholder="Votre message…" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting} className="rounded-lg bg-primary hover:bg-primary/90 text-sm h-9 font-semibold">{submitting ? "…" : "Publier"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="rounded-lg text-sm text-muted-foreground h-9">Annuler</Button>
        </div>
      </form>
    </div>
  )
}
