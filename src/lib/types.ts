export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string
  sort_order: number
  topic_count: number
  created_at: string
}

export type Topic = {
  id: string
  title: string
  slug: string
  category_id: string | null
  author_id: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  last_reply_at: string | null
  last_reply_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  category?: Category
  last_reply_author?: Profile
}

export type Post = {
  id: string
  topic_id: string
  author_id: string
  content: string
  is_edited: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  like_count?: number
  is_liked?: boolean
}

export type Like = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}
