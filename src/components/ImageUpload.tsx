"use client"

import { useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function ImageUpload({
  bucket,
  onUpload,
  currentUrl,
  accept = "image/png,image/jpeg,image/gif,image/webp",
  label = "Changer",
}: {
  bucket: "avatars" | "banners"
  onUpload: (url: string) => void
  currentUrl?: string | null
  accept?: string
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = useCallback(async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploading(false); return }
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      onUpload(publicUrl)
      setUploading(false)
    }
    input.click()
  }, [bucket, supabase, onUpload, accept])

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={uploading}
      className="rounded-full text-xs">
      {uploading ? "…" : label}
    </Button>
  )
}
