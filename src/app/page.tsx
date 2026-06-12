import { createClient } from "@/lib/supabase/server"
import { CategoryCard } from "@/components/CategoryCard"
import { TopicCard } from "@/components/TopicCard"
import Link from "next/link"
import type { Category, Topic } from "@/lib/types"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order")
    .throwOnError()

  const { data: topics } = await supabase
    .from("topics")
    .select(`
      *,
      author:profiles!topics_author_id_fkey(*),
      category:categories(*),
      last_reply_author:profiles!topics_last_reply_by_fkey(*)
    `)
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .limit(20)
    .throwOnError()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          Bienvenue sur{" "}
          <span className="text-or">Carré</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
          Un espace de discussion élégant. Simple, rapide, sans distraction.
        </p>
        <div className="mt-8">
          <Link href="/new" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau sujet
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-semibold mb-6">Catégories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categories as Category[]).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Topics */}
      <section>
        <h2 className="font-display text-2xl font-semibold mb-6">Discussions récentes</h2>
        {topics && topics.length > 0 ? (
          <div className="space-y-3">
            {(topics as Topic[]).map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-text-secondary mb-4">Aucune discussion pour le moment.</p>
            <Link href="/new" className="btn-primary text-sm inline-flex">
              Lancer la première discussion
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
