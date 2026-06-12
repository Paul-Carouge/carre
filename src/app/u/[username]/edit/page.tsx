"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import type { Profile } from "@/lib/types"

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [titleColor, setTitleColor] = useState("#FF4D1C")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()
      if (p) {
        const pr = p as Profile
        setProfile(pr)
        setDisplayName(pr.display_name || "")
        setBio(pr.bio || "")
        setLocation(pr.location || "")
        setWebsite(pr.website || "")
        setTitleColor(pr.title_color || "#FF4D1C")
      }
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(""); setSuccess("")
    try {
      const { error: ue } = await supabase.from("profiles").update({
        display_name: displayName,
        bio, location, website,
        title_color: titleColor,
      }).eq("id", profile!.id)
      if (ue) throw ue
      setSuccess("Profil mis à jour !")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const uploadFile = useCallback(async (bucket: "avatars" | "banners", setUploading: (v: boolean) => void) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !profile) return
      setUploading(true)
      const path = `${profile.id}/${Date.now()}-${file.name}`
      await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      const col = bucket === "avatars" ? "avatar_url" : "banner_url"
      await supabase.from("profiles").update({ [col]: publicUrl }).eq("id", profile.id)
      setProfile({ ...profile, [col]: publicUrl })
      setUploading(false)
    }
    input.click()
  }, [profile, supabase])

  if (!profile) return <div className="min-h-[50vh] flex items-center justify-center"><div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>

  return (
    <div className="container-fluid content-constrain py-10 max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-8">Modifier le profil</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">{error}</div>}
        {success && <div className="bg-success/10 border border-success/20 text-success text-sm rounded-lg px-4 py-3">{success}</div>}

        {/* Avatar + Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="panel p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">Avatar</p>
            <div className="flex items-center gap-3">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground ring-2 ring-border">
                {(profile.display_name || profile.username)[0].toUpperCase()}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => uploadFile("avatars", setAvatarUploading)} disabled={avatarUploading} className="rounded-lg text-xs">
                {avatarUploading ? "…" : "Changer"}
              </Button>
            </div>
          </div>
          <div className="panel p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">Bannière</p>
            <Button type="button" variant="outline" size="sm" onClick={() => uploadFile("banners", setBannerUploading)} disabled={bannerUploading} className="rounded-lg text-xs w-full">
              {bannerUploading ? "…" : "Changer la bannière"}
            </Button>
          </div>
        </div>

        {/* Identity */}
        <div className="panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">Identité</p>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nom affiché</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Votre nom" className="bg-background border-border text-sm h-9 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Bio</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Parlez un peu de vous…" rows={3} className="bg-background border-border text-sm rounded-lg resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Localisation</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ville, Pays" className="bg-background border-border text-sm h-9 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Site web</label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="bg-background border-border text-sm h-9 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="panel p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">Couleur du pseudo</p>
          <div className="flex items-center gap-3">
            {["#FF4D1C", "#00D4AA", "#6366F1", "#F59E0B", "#EC4899", "#FFFFFF"].map(c => (
              <button key={c} type="button" onClick={() => setTitleColor(c)}
                className="size-8 rounded-full border-2 transition-all hover:scale-110"
                style={{ background: c, borderColor: titleColor === c ? "white" : "transparent" }} />
            ))}
            <Input type="text" value={titleColor} onChange={e => setTitleColor(e.target.value)}
              className="bg-background border-border text-xs h-8 w-28 rounded-lg font-mono" placeholder="#hex" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="rounded-lg bg-primary hover:bg-primary/90 text-sm h-10 font-semibold px-6">{saving ? "…" : "Enregistrer"}</Button>
          <Link href={`/u/${profile.username}`}><Button type="button" variant="ghost" className="rounded-lg text-sm text-muted-foreground h-10">Annuler</Button></Link>
        </div>
      </form>
    </div>
  )
}
