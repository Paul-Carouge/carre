-- ============================================
-- Carré Forum — Database Schema for Supabase
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#D4A040',
  icon TEXT DEFAULT 'message-circle',
  sort_order INT DEFAULT 0,
  topic_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TOPICS
-- ============================================
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_author ON public.topics(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_last_reply ON public.topics(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_pinned ON public.topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON public.posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: readable by all, writable by owner
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories: readable by all, writable by authenticated users
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create categories" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update categories" ON public.categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Topics: readable by all, writable by owner
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are viewable by everyone" ON public.topics
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics" ON public.topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own topics" ON public.topics
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own topics" ON public.topics
  FOR DELETE USING (auth.uid() = author_id);

-- Posts: readable by all, writable by owner
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Likes: readable by all, writable by owner
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA — Default Categories
-- ============================================
INSERT INTO public.categories (name, slug, description, color, icon, sort_order) VALUES
  ('Général', 'general', 'Discussions libres et variées. Le point de départ pour tous les sujets.', '#D4A040', 'message-circle', 0),
  ('Technologie', 'technologie', 'Code, hardware, IA, web, mobile — tout ce qui touche à la tech.', '#4ADE80', 'code', 1),
  ('Création', 'creation', 'Design, musique, écriture, vidéo — exprimez votre créativité.', '#60A5FA', 'image', 2),
  ('Jeux vidéo', 'jeux-video', 'Gaming, actualités, entraide — la pause ludique.', '#F472B6', 'gamepad', 3),
  ('Divertissement', 'divertissement', 'Films, séries, livres, podcasts — ce qui vous fait vibrer.', '#A78BFA', 'music', 4),
  ('Débats', 'debats', 'Échangez vos opinions dans le respect. Société, philo, actualités.', '#FB923C', 'globe', 5)
ON CONFLICT (slug) DO NOTHING;
