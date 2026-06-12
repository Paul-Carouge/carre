import Link from "next/link"
import type { Category } from "@/lib/types"

const ICONS: Record<string, string> = {
  "message-circle": "💬",
  code: "</>",
  image: "🖼",
  music: "🎵",
  book: "📖",
  coffee: "☕",
  gamepad: "🎮",
  camera: "📷",
  globe: "🌐",
}

export function CategoryCard({ category }: { category: Category }) {
  const emoji = ICONS[category.icon] || "💬"

  return (
    <Link
      href={`/c/${category.slug}`}
      className="block glass rounded-xl p-5 glass-hover transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{
            background: `${category.color}18`,
            color: category.color,
          }}
        >
          {emoji}
        </div>
        <div>
          <h3
            className="font-display text-base font-semibold group-hover:text-or transition-colors"
            style={{ color: category.color }}
          >
            {category.name}
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {category.topic_count} sujet{category.topic_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {category.description && (
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      )}
    </Link>
  )
}
