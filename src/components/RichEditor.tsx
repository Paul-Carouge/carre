"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import LinkExt from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

const COLORS = ["#FF4D1C", "#00D4AA", "#6366F1", "#F59E0B", "#EC4899", "#FFFFFF", "#9A9BA0"]

export function RichEditor({ content, onChange, placeholder = "Écrivez…" }: { content: string; onChange: (html: string) => void; placeholder?: string }) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-forum focus:outline-none min-h-[200px] px-4 py-3 text-foreground",
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

  const setColor = (color: string) => editor.chain().focus().setColor(color).run()

  return (
    <div className="panel overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-all">
      {/* Toolbar row 1 — text formatting */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
        {btn("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "font-bold")}
        {btn("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "italic")}
        {btn("U", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "underline")}
        {btn("S", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
        {btn("H", () => editor.chain().focus().toggleHighlight().run(), editor.isActive("highlight"))}
        <div className="w-px h-4 bg-border mx-1" />
        {btn("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {btn("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        <div className="w-px h-4 bg-border mx-1" />
        {btn("❝", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {btn("•", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {btn("1.", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {btn("</>", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        {btn("—", () => editor.chain().focus().setHorizontalRule().run(), false)}
        <div className="w-px h-4 bg-border mx-1" />
        {btn("⫷", () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }))}
        {btn("⫿", () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }))}
        {btn("⫸", () => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }))}
        <div className="flex-1" />
        {btn(uploading ? "⏳" : "🖼", uploadImage, false)}
      </div>

      {/* Toolbar row 2 — colors */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground font-mono mr-1">Couleur:</span>
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)}
            className="size-5 rounded-full border transition-all hover:scale-110"
            style={{ background: c, borderColor: editor.isActive("textStyle", { color: c }) ? "white" : "transparent" }}
            title={c} />
        ))}
        <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
          className="text-[10px] text-muted-foreground hover:text-foreground font-mono ml-1">×</button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
