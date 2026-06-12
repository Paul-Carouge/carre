import Link from "next/link"
import type { Category, Topic } from "@/lib/types"
import { UserAvatar } from "./UserAvatar"
import { TimeAgo } from "./TimeAgo"

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      href={`/t/${topic.slug}`}
      className="block glass rounded-xl p-5 glass-hover accent-glow transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <UserAvatar user={topic.author!} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {topic.is_pinned && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-or bg-or-subtle px-2 py-0.5 rounded-full">
                Épinglé
              </span>
            )}
            {topic.category && (
              <span
                className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  color: topic.category.color,
                  background: `${topic.category.color}15`,
                }}
              >
                {topic.category.name}
              </span>
            )}
          </div>

          <h3 className="font-display text-lg font-semibold text-text-primary group-hover:text-or transition-colors truncate">
            {topic.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
            <span>{topic.author?.display_name || topic.author?.username}</span>
            <span>·</span>
            <TimeAgo date={topic.created_at} />
            {topic.last_reply_at && (
              <>
                <span>·</span>
                <span>
                  Dernière réponse <TimeAgo date={topic.last_reply_at} />
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-tertiary shrink-0">
          <div className="flex items-center gap-1" title={`${topic.reply_count} réponses`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{topic.reply_count}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
