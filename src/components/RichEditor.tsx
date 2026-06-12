"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import LinkExt from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export function RichEditor({ content, onChange, placeholder = "Écrivez…" }: { content: string; onChange: (html: string) => void; placeholder?: string }) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit, Image.configure({ allowBase64: true }), LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }), Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-forum focus:outline-none min-h-[180px] px-4 py-3 text-foreground",
      },
    },
  })

  const uploadImage = useCallback(async () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editor) return
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploading(false); return }
      const path = `${user.id}/${Date.now()}-${file.name}`
      await supabase.storage.from("uploads").upload(path, file)
      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path)
      editor.chain().focus().setImage({ src: publicUrl }).run()
      setUploading(false)
    }
    input.click()
  }, [editor, supabase])

  if (!editor) return null

  const btn = (l: string, a: () => void, active: boolean, cls = "") => (
    <button type="button" onClick={a} className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${cls}`}>{l}</button>
  )

  return (
    <div className="card-panel overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-all">
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20">
        {btn("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "font-bold")}
        {btn("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "italic")}
        {btn("U", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "underline")}
        <div className="w-px h-4 bg-border mx-1" />
        {btn("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {btn("❝", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {btn("•", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {btn("</>", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        <div className="flex-1" />
        {btn(uploading ? "⏳" : "🖼", uploadImage, false)}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
