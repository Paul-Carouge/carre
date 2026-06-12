"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import slugify from "slugify"

/* ─── types ─── */
interface Trophy {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  color: string
  tier: string
  requirement_type: string
  requirement_count: number
  goal_description?: string | null
  icon_url?: string | null
  created_at?: string
}

type Tier = "bronze" | "silver" | "gold" | "diamond"
type RequirementType = "posts" | "likes" | "topics" | "days"

const TIERS: Tier[] = ["bronze", "silver", "gold", "diamond"]
const REQUIREMENT_TYPES: RequirementType[] = ["posts", "likes", "topics", "days"]
const COLOR_PRESETS = ["#FF4D1C", "#00D4AA", "#6366F1", "#F59E0B", "#EC4899", "#FFFFFF"]

const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  diamond: "Diamant",
}

const TIER_EMOJIS: Record<Tier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
}

const REQ_LABELS: Record<RequirementType, string> = {
  posts: "Messages",
  likes: "Likes reçus",
  topics: "Sujets créés",
  days: "Jours d'ancienneté",
}

/* ─── default form ─── */
const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  icon: "🏆",
  color: "#FF4D1C",
  tier: "bronze" as Tier,
  requirement_type: "posts" as RequirementType,
  requirement_count: 1,
  goal_description: "",
  icon_url: "",
}

export default function AdminPage() {
  const supabase = createClient()

  /* auth */
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  /* trophies */
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [loading, setLoading] = useState(true)

  /* form */
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [customColor, setCustomColor] = useState("")

  /* ── auth check ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
    })
  }, [])

  /* ── fetch trophies ── */
  const fetchTrophies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("trophies")
      .select("*")
      .order("tier")
      .order("name")
    if (!error && data) setTrophies(data as Trophy[])
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchTrophies()
  }, [user])

  /* ── slug auto-gen ── */
  const updateName = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: slugify(name, { lower: true, strict: true }),
    }))
  }

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setMessage(null)

    const payload: Record<string, any> = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name, { lower: true, strict: true }),
      description: form.description || null,
      icon: form.icon || "🏆",
      color: form.color,
      tier: form.tier,
      requirement_type: form.requirement_type,
      requirement_count: form.requirement_count,
    }

    /* try to include optional columns */
    const optionalFields: Record<string, any> = {}
    if (form.goal_description) optionalFields.goal_description = form.goal_description
    if (form.icon_url) optionalFields.icon_url = form.icon_url

    try {
      if (editingId) {
        /* update */
        const updatePayload = { ...payload, ...optionalFields }
        const { error } = await supabase
          .from("trophies")
          .update(updatePayload)
          .eq("id", editingId)
        if (error) throw error
        setMessage({ type: "success", text: "Trophée mis à jour." })
      } else {
        /* insert — try with optional columns first, fallback */
        let { error } = await supabase
          .from("trophies")
          .insert({ ...payload, ...optionalFields })
        if (error) {
          /* columns may not exist — retry without optional */
          const { error: retryErr } = await supabase
            .from("trophies")
            .insert(payload)
          if (retryErr) throw retryErr
        }
        setMessage({ type: "success", text: "Trophée créé." })
      }

      setForm({ ...EMPTY_FORM })
      setEditingId(null)
      setCustomColor("")
      fetchTrophies()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erreur inconnue" })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── delete ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le trophée « ${name} » ?`)) return
    const { error } = await supabase.from("trophies").delete().eq("id", id)
    if (error) {
      setMessage({ type: "error", text: error.message })
      return
    }
    setMessage({ type: "success", text: "Trophée supprimé." })
    fetchTrophies()
  }

  /* ── edit ── */
  const handleEdit = (t: Trophy) => {
    setForm({
      name: t.name,
      slug: t.slug,
      description: t.description || "",
      icon: t.icon,
      color: t.color,
      tier: t.tier as Tier,
      requirement_type: t.requirement_type as RequirementType,
      requirement_count: t.requirement_count,
      goal_description: t.goal_description || "",
      icon_url: t.icon_url || "",
    })
    setEditingId(t.id)
    setCustomColor("")
    setMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /* ── cancel edit ── */
  const handleCancelEdit = () => {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setCustomColor("")
    setMessage(null)
  }

  /* ── icon upload ── */
  const handleIconUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/gif,image/webp"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const path = `icons/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("trophies").upload(path, file, { upsert: true })
      if (error) {
        setMessage({ type: "error", text: "Échec de l'upload : " + error.message })
        return
      }
      const { data } = supabase.storage.from("trophies").getPublicUrl(path)
      setForm(f => ({ ...f, icon_url: data.publicUrl }))
      setMessage({ type: "success", text: "Icône uploadée." })
    }
    input.click()
  }

  /* ── auth guard ── */
  if (authLoading) {
    return (
      <div className="container-fluid content-constrain min-h-[60vh] flex items-center justify-center">
        <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-fluid content-constrain min-h-[60vh] flex items-center justify-center">
        <div className="panel p-10 text-center max-w-md">
          <p className="text-muted-foreground text-sm font-mono">
            Connectez-vous pour accéder à l&apos;administration.
          </p>
        </div>
      </div>
    )
  }

  /* ── page ── */
  return (
    <div className="container-fluid content-constrain py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Administration · Trophées</h1>

      {/* feedback */}
      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-secondary/10 border border-secondary/20 text-secondary"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── 1. Trophées existants ── */}
      <section className="mb-14">
        <h2 className="font-display text-xl font-bold mb-5">
          Trophées existants
          <span className="ml-2 text-sm font-normal text-muted-foreground font-mono">
            {trophies.length}
          </span>
        </h2>

        {loading ? (
          <div className="panel p-12 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : trophies.length === 0 ? (
          <div className="panel p-12 text-center text-muted-foreground text-sm">
            Aucun trophée pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trophies.map(t => (
              <div
                key={t.id}
                className="panel p-5 rounded-xl border-border flex flex-col gap-3"
                style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}
              >
                {/* header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{t.icon || "🏆"}</span>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-sm truncate">{t.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        {TIER_LABELS[t.tier as Tier] || t.tier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Modifier"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Supprimer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                {/* description */}
                {t.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                )}

                {/* requirement */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">
                    {t.requirement_count.toLocaleString()}
                  </span>
                  <span>{REQ_LABELS[t.requirement_type as RequirementType] || t.requirement_type}</span>
                </div>

                {/* color dot + slug */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
                  <span
                    className="size-2.5 rounded-full shrink-0 ring-1 ring-border"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate">/{t.slug}</span>
                </div>

                {/* goal description */}
                {t.goal_description && (
                  <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed">
                    {t.goal_description}
                  </p>
                )}

                {/* icon_url preview */}
                {t.icon_url && (
                  <img
                    src={t.icon_url}
                    alt=""
                    className="w-8 h-8 rounded object-cover ring-1 ring-border"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Nouveau trophée / Édition ── */}
      <section>
        <h2 className="font-display text-xl font-bold mb-5">
          {editingId ? "Modifier le trophée" : "Nouveau trophée"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          {/* name */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Nom
            </label>
            <Input
              value={form.name}
              onChange={e => updateName(e.target.value)}
              required
              placeholder="Ex: Premier message"
              className="bg-card border-border rounded-lg text-sm h-10"
            />
          </div>

          {/* slug (read-only, auto) */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Slug
            </label>
            <Input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-généré"
              className="bg-card border-border rounded-lg text-sm h-10 font-mono text-muted-foreground"
            />
          </div>

          {/* description */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brève description du trophée…"
              className="bg-card border-border rounded-lg text-sm"
            />
          </div>

          {/* icon (emoji) */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Icône (emoji)
            </label>
            <div className="flex items-center gap-3">
              <Input
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                maxLength={4}
                placeholder="🏆"
                className="bg-card border-border rounded-lg text-sm h-10 w-20 text-center text-xl"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {["🏆", "⭐", "🔥", "💬", "❤️", "🎯", "🚀", "💎", "👑", "🎖️"].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={`size-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      form.icon === emoji
                        ? "bg-primary/20 ring-1 ring-primary/40"
                        : "hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* color */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Couleur
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, color: c })); setCustomColor("") }}
                  className={`size-8 rounded-lg transition-all ring-offset-1 ${
                    form.color === c && !customColor
                      ? "ring-2 ring-primary scale-110"
                      : "ring-1 ring-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">Custom:</span>
              <input
                type="color"
                value={customColor || form.color}
                onChange={e => {
                  setCustomColor(e.target.value)
                  setForm(f => ({ ...f, color: e.target.value }))
                }}
                className="size-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={customColor || form.color}
                onChange={e => {
                  setCustomColor(e.target.value)
                  setForm(f => ({ ...f, color: e.target.value }))
                }}
                placeholder="#FF4D1C"
                className="bg-card border-border rounded-lg text-sm h-10 w-28 font-mono"
              />
            </div>
          </div>

          {/* tier */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Niveau
            </label>
            <div className="flex items-center gap-2">
              {TIERS.map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tier }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    form.tier === tier
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  <span>{TIER_EMOJIS[tier]}</span>
                  <span>{TIER_LABELS[tier]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* requirement_type + requirement_count */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Condition de déblocage
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={form.requirement_type}
                onChange={e => setForm(f => ({ ...f, requirement_type: e.target.value as RequirementType }))}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                {REQUIREMENT_TYPES.map(rt => (
                  <option key={rt} value={rt}>{REQ_LABELS[rt]}</option>
                ))}
              </select>
              <Input
                type="number"
                value={form.requirement_count}
                onChange={e => setForm(f => ({ ...f, requirement_count: Math.max(1, parseInt(e.target.value) || 1) }))}
                min={1}
                required
                className="bg-card border-border rounded-lg text-sm h-10 w-24 font-mono"
              />
            </div>
          </div>

          {/* goal_description */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Objectif pour débloquer ce trophée
            </label>
            <Textarea
              value={form.goal_description}
              onChange={e => setForm(f => ({ ...f, goal_description: e.target.value }))}
              rows={2}
              placeholder="Ex: Atteindre 100 messages sur le forum"
              className="bg-card border-border rounded-lg text-sm"
            />
          </div>

          {/* icon_url upload */}
          <div className="panel p-5 rounded-xl">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono uppercase tracking-wider">
              Image du trophée
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleIconUpload}
                className="rounded-lg text-sm h-10 border-border"
              >
                📤 Uploader une image
              </Button>
              {form.icon_url && (
                <div className="flex items-center gap-2">
                  <img src={form.icon_url} alt="" className="size-8 rounded object-cover ring-1 ring-border" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon_url: "" }))}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors font-mono"
                  >
                    ✕ Retirer
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
              Stocké dans le bucket Supabase « trophies »
            </p>
          </div>

          {/* submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 rounded-lg font-semibold text-sm h-10 px-6"
            >
              {submitting ? "…" : editingId ? "Mettre à jour" : "Créer le trophée"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelEdit}
                className="rounded-lg text-sm text-muted-foreground h-10"
              >
                Annuler
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
