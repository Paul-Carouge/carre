import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TopicCard } from "@/components/TopicCard"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!category) notFound()

  const { data: topics } = await supabase
    .from("topics")
    .select(`
      *,
      author:profiles!topics_author_id_fkey(*),
      category:categories(*),
      last_reply_author:profiles!topics_last_reply_by_fkey(*)
    `)
    .eq("category_id", (category as Category).id)
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .limit(50)
    .throwOnError()

  const cat = category as Category

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-8">
        <Link href="/" className="hover:text-or transition-colors">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{cat.name}</span>
      </nav>

      {/* Category Header */}
      <div className="glass rounded-xl p-6 mb-8 accent-glow">
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `${cat.color}18`,
              color: cat.color,
            }}
          >
            💬
          </div>
          <div>
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: cat.color }}
            >
              {cat.name}
            </h1>
            <p className="text-sm text-text-tertiary mt-1">
              {cat.topic_count} sujet{cat.topic_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {cat.description && (
          <p className="text-text-secondary text-sm">{cat.description}</p>
        )}
      </div>

      {/* Topics */}
      {topics && topics.length > 0 ? (
        <div className="space-y-3">
          {(topics as Topic[]).map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-text-secondary mb-4">
            Aucun sujet dans cette catégorie.
          </p>
          <Link href="/new" className="btn-primary text-sm inline-flex">
            Créer le premier sujet
          </Link>
        </div>
      )}
    </div>
  )
}
