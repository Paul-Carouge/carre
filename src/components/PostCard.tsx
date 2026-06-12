import type { Post } from "@/lib/types"
import { UserAvatar } from "./UserAvatar"
import { TimeAgo } from "./TimeAgo"
import { LikeButton } from "./LikeButton"

export function PostCard({ post }: { post: Post }) {
  return (
    <div className="glass rounded-xl p-5 group" id={`post-${post.id}`}>
      <div className="flex items-start gap-4">
        <UserAvatar user={post.author!} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-sm text-text-primary">
              {post.author?.display_name || post.author?.username}
            </span>
            <span className="text-xs text-text-tertiary">
              <TimeAgo date={post.created_at} />
            </span>
            {post.is_edited && (
              <span className="text-[10px] text-text-tertiary italic">(modifié)</span>
            )}
          </div>

          <div
            className="prose-forum"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
            <LikeButton post={post} />
          </div>
        </div>
      </div>
    </div>
  )
}
