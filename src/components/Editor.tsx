"use client"

import { useState } from "react"

export function Editor({
  value,
  onChange,
  placeholder = "Écrivez votre message...",
  minHeight = "200px",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}) {
  return (
    <div className="glass rounded-xl overflow-hidden focus-within:border-or/30 transition-all">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] bg-surface/50">
        <ToolbarButton label="Gras" shortcut="B" onClick={() => wrapSelection("**", "**")} />
        <ToolbarButton label="Italique" shortcut="I" onClick={() => wrapSelection("*", "*")} />
        <div className="w-px h-4 bg-white/[0.08] mx-1" />
        <ToolbarButton label="Lien" shortcut="🔗" onClick={() => wrapSelection("[", "](url)")} />
        <ToolbarButton label="Code" shortcut="<>" onClick={() => wrapSelection("`", "`")} />
        <ToolbarButton label="Citation" shortcut="❝" onClick={() => wrapLine("> ")} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-4 py-3 text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none text-sm leading-relaxed"
        style={{ minHeight }}
      />
    </div>
  )
}

function ToolbarButton({
  label,
  shortcut,
  onClick,
}: {
  label: string
  shortcut: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded transition-colors"
      title={label}
    >
      {shortcut}
    </button>
  )
}

// Helper functions for text manipulation (used via textarea ref in real app)
function wrapSelection(before: string, after: string) {
  // This is a simplified version — in production, use a ref to the textarea
  console.log("Wrap:", before, after)
}

function wrapLine(prefix: string) {
  console.log("Wrap line:", prefix)
}
