export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  banner_url: string | null
  title_color: string | null
  title_effect: string | null
  post_count: number
  like_count: number
  trophy_count: number
  website: string | null
  location: string | null
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

export type Trophy = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  color: string
  tier: string
  requirement_type: string
  requirement_count: number
  icon_url?: string | null
  goal_description?: string | null
}

export type UserTrophy = {
  id: string
  user_id: string
  trophy_id: string
  earned_at: string
  trophy?: Trophy
}

export type Notification = {
  id: string
  user_id: string
  actor_id: string
  type: "like" | "reply" | "follow" | "trophy" | "mention"
  topic_id: string | null
  post_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
  topic?: Topic
  post?: Post
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export type SearchResult = {
  type: "user" | "topic"
  user?: Profile
  topic?: Topic
}
