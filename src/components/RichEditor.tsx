"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function RichEditor({
  content,
  onChange,
  placeholder = "Écrivez…",
}: {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-forum focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  })

  const uploadImage = useCallback(async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/gif,image/webp"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editor) return
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploading(false); return }
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("uploads").upload(path, file)
      if (error) { setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path)
      editor.chain().focus().setImage({ src: publicUrl }).run()

      // Track upload
      await supabase.from("uploads").insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        public_url: publicUrl,
      })
      setUploading(false)
    }
    input.click()
  }, [editor, supabase])

  if (!editor) return null

  return (
    <div className="panel-offwhite rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/30">
        {[
          { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), className: "font-bold" },
          { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), className: "italic" },
          { label: "U", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), className: "underline" },
        ].map((btn) => (
          <button key={btn.label} type="button" onClick={btn.action}
            className={`px-2 py-1 text-xs rounded transition-colors ${btn.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {btn.label}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        {[
          { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
          { label: "H3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
        ].map((btn) => (
          <button key={btn.label} type="button" onClick={btn.action}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${btn.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {btn.label}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        {[
          { label: "❝", action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
          { label: "•", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
          { label: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
          { label: "</>", action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
        ].map((btn) => (
          <button key={btn.label} type="button" onClick={btn.action}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${btn.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={uploadImage} disabled={uploading}
          className="px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors">
          {uploading ? "⏳" : "🖼"}
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
