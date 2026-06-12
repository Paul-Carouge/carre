-- ============================================
-- 4by4 — Migration v2 : Notifications, Follows, Trophées, Profils
-- ============================================

-- 1. PROFILES — Ajout colonnes manquantes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title_color TEXT DEFAULT '#FF4D1C';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title_effect TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS post_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophy_count INT DEFAULT 0;

-- 2. TROPHIES — Ajout colonnes pour admin
ALTER TABLE public.trophies ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.trophies ADD COLUMN IF NOT EXISTS goal_description TEXT;

-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'reply', 'follow', 'trophy', 'mention')),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

-- 4. FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 5. TRIGGER — Notification on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, post_id, topic_id)
  SELECT p.author_id, NEW.user_id, 'like', NEW.post_id, p.topic_id
  FROM public.posts p WHERE p.id = NEW.post_id AND p.author_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_like ON public.likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- 6. TRIGGER — Notification on reply
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify topic author
  INSERT INTO public.notifications (user_id, actor_id, type, post_id, topic_id)
  SELECT t.author_id, NEW.author_id, 'reply', NEW.id, NEW.topic_id
  FROM public.topics t WHERE t.id = NEW.topic_id AND t.author_id != NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_reply ON public.posts;
CREATE TRIGGER trg_notify_reply AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();

-- 7. TRIGGER — Notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- 8. TRIGGER — Update profile post_count & like_count
CREATE OR REPLACE FUNCTION public.update_profile_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_author UUID;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    v_author := NEW.author_id;
    UPDATE public.profiles SET post_count = (SELECT COUNT(*) FROM public.posts WHERE author_id = v_author) WHERE id = v_author;
  ELSIF TG_TABLE_NAME = 'likes' THEN
    SELECT p.author_id INTO v_author FROM public.posts p WHERE p.id = NEW.post_id;
    UPDATE public.profiles SET like_count = (
      SELECT COUNT(*) FROM public.likes l JOIN public.posts pp ON l.post_id = pp.id WHERE pp.author_id = v_author
    ) WHERE id = v_author;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profile_counts_post ON public.posts;
CREATE TRIGGER trg_profile_counts_post AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_counts();

DROP TRIGGER IF EXISTS trg_profile_counts_like ON public.likes;
CREATE TRIGGER trg_profile_counts_like AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_counts();

-- 9. Fix: update existing profile counts
UPDATE public.profiles p SET
  post_count = (SELECT COUNT(*) FROM public.posts WHERE author_id = p.id),
  like_count = (SELECT COUNT(*) FROM public.likes l JOIN public.posts pp ON l.post_id = pp.id WHERE pp.author_id = p.id);
