-- ═══════════════════════════════════
-- 4by4 — Extended Schema
-- Trophées, bannières, uploads, stats
-- ═══════════════════════════════════

-- ============================================
-- PROFILES — Extended
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS title_color TEXT DEFAULT '#FF4D1C',
  ADD COLUMN IF NOT EXISTS title_effect TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS post_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trophy_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- ============================================
-- UPLOADS — Shared files & images
-- ============================================
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TROPHIES — Achievement definitions
-- ============================================
CREATE TABLE IF NOT EXISTS public.trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  color TEXT DEFAULT '#FF4D1C',
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, diamond
  requirement_type TEXT NOT NULL, -- posts, likes, days, topics
  requirement_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TROPHIES — Earned by users
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  trophy_id UUID REFERENCES public.trophies(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trophy_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_uploads_post ON public.uploads(post_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trophies_user ON public.user_trophies(user_id);

-- ============================================
-- RLS — Uploads
-- ============================================
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Uploads are viewable by everyone" ON public.uploads FOR SELECT USING (true);
CREATE POLICY "Users can insert own uploads" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own uploads" ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- RLS — Trophies (readable by all)
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trophies are viewable by everyone" ON public.trophies FOR SELECT USING (true);

-- RLS — User Trophies
ALTER TABLE public.user_trophies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User trophies are viewable by everyone" ON public.user_trophies FOR SELECT USING (true);

-- ============================================
-- SEED TROPHIES
-- ============================================
INSERT INTO public.trophies (name, slug, description, icon, color, tier, requirement_type, requirement_count) VALUES
  ('Premier pas', 'first-post', 'Publier votre premier message', '👶', '#CD7F32', 'bronze', 'posts', 1),
  ('Conversationaliste', '10-posts', 'Publier 10 messages', '💬', '#CD7F32', 'bronze', 'posts', 10),
  ('Orateur', '50-posts', 'Publier 50 messages', '🎙️', '#C0C0C0', 'silver', 'posts', 50),
  ('Vétéran', '100-posts', 'Publier 100 messages', '🎖️', '#FFD700', 'gold', 'posts', 100),
  ('Légende', '500-posts', 'Publier 500 messages', '👑', '#B9F2FF', 'diamond', 'posts', 500),
  ('Apprécié', '10-likes', 'Recevoir 10 likes', '❤️', '#CD7F32', 'bronze', 'likes', 10),
  ('Populaire', '50-likes', 'Recevoir 50 likes', '🌟', '#C0C0C0', 'silver', 'likes', 50),
  ('Star', '100-likes', 'Recevoir 100 likes', '⭐', '#FFD700', 'gold', 'likes', 100),
  ('Créateur', 'first-topic', 'Créer votre premier sujet', '📝', '#CD7F32', 'bronze', 'topics', 1),
  ('Animateur', '10-topics', 'Créer 10 sujets', '📢', '#C0C0C0', 'silver', 'topics', 10),
  ('Pilier', '30-topics', 'Créer 30 sujets', '🏛️', '#FFD700', 'gold', 'topics', 30),
  ('Fidèle', '7-days', '7 jours d''activité', '📅', '#CD7F32', 'bronze', 'days', 7),
  ('Habitué', '30-days', '30 jours d''activité', '🗓️', '#C0C0C0', 'silver', 'days', 30),
  ('Incontournable', '90-days', '90 jours d''activité', '💎', '#FFD700', 'gold', 'days', 90)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FUNCTION — Check & award trophies
-- ============================================
CREATE OR REPLACE FUNCTION public.check_trophies()
RETURNS TRIGGER AS $$
DECLARE
  t record;
  post_count INT;
  like_count INT;
  topic_count INT;
  active_days INT;
BEGIN
  -- Count user stats
  SELECT COUNT(*) INTO post_count FROM public.posts WHERE author_id = NEW.author_id;
  SELECT COUNT(*) INTO like_count FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE author_id = NEW.author_id);
  SELECT COUNT(*) INTO topic_count FROM public.topics WHERE author_id = NEW.author_id;
  SELECT COUNT(DISTINCT DATE(created_at)) INTO active_days FROM public.posts WHERE author_id = NEW.author_id;

  -- Update profile stats
  UPDATE public.profiles SET 
    post_count = post_count,
    like_count = like_count,
    trophy_count = (SELECT COUNT(*) FROM public.user_trophies WHERE user_id = NEW.author_id)
  WHERE id = NEW.author_id;

  -- Award matching trophies
  FOR t IN SELECT * FROM public.trophies LOOP
    IF t.requirement_type = 'posts' AND post_count >= t.requirement_count THEN
      INSERT INTO public.user_trophies (user_id, trophy_id) VALUES (NEW.author_id, t.id) ON CONFLICT DO NOTHING;
    ELSIF t.requirement_type = 'likes' AND like_count >= t.requirement_count THEN
      INSERT INTO public.user_trophies (user_id, trophy_id) VALUES (NEW.author_id, t.id) ON CONFLICT DO NOTHING;
    ELSIF t.requirement_type = 'topics' AND topic_count >= t.requirement_count THEN
      INSERT INTO public.user_trophies (user_id, trophy_id) VALUES (NEW.author_id, t.id) ON CONFLICT DO NOTHING;
    ELSIF t.requirement_type = 'days' AND active_days >= t.requirement_count THEN
      INSERT INTO public.user_trophies (user_id, trophy_id) VALUES (NEW.author_id, t.id) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new post
DROP TRIGGER IF EXISTS check_trophies_on_post ON public.posts;
CREATE TRIGGER check_trophies_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_trophies();

-- Trigger on new topic
DROP TRIGGER IF EXISTS check_trophies_on_topic ON public.topics;
CREATE TRIGGER check_trophies_on_topic
  AFTER INSERT ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.check_trophies();
