-- ═══════════════════════════════════
-- 4by4 — Schema v3 : Complétude forum
-- Triggers auto-sync, notifications,
-- subscriptions, bookmarks
-- ═══════════════════════════════════

-- ============================================
-- 1. AUTO-SYNC TRIGGERS
-- ============================================

-- reply_count on topics
CREATE OR REPLACE FUNCTION public.sync_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE topics SET reply_count = (SELECT COUNT(*) FROM posts WHERE topic_id = NEW.topic_id), updated_at = NOW() WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE topics SET reply_count = (SELECT COUNT(*) FROM posts WHERE topic_id = OLD.topic_id), updated_at = NOW() WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_reply_count ON posts;
CREATE TRIGGER sync_reply_count AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION sync_topic_reply_count();

-- topic_count on categories
CREATE OR REPLACE FUNCTION public.sync_category_topic_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.category_id IS NOT NULL THEN
    UPDATE categories SET topic_count = (SELECT COUNT(*) FROM topics WHERE category_id = NEW.category_id) WHERE id = NEW.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories SET topic_count = (SELECT COUNT(*) FROM topics WHERE category_id = OLD.category_id) WHERE id = OLD.category_id;
    END IF;
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories SET topic_count = (SELECT COUNT(*) FROM topics WHERE category_id = NEW.category_id) WHERE id = NEW.category_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.category_id IS NOT NULL THEN
    UPDATE categories SET topic_count = (SELECT COUNT(*) FROM topics WHERE category_id = OLD.category_id) WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_category_count ON topics;
CREATE TRIGGER sync_category_count AFTER INSERT OR UPDATE OF category_id OR DELETE ON topics
  FOR EACH ROW EXECUTE FUNCTION sync_category_topic_count();

-- updated_at auto-set
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS topics_updated_at ON topics;
CREATE TRIGGER topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- post_count on profiles (when creating/deleting posts)
CREATE OR REPLACE FUNCTION public.sync_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = (SELECT COUNT(*) FROM posts WHERE author_id = NEW.author_id) WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = (SELECT COUNT(*) FROM posts WHERE author_id = OLD.author_id) WHERE id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_posts ON posts;
CREATE TRIGGER sync_profile_posts AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION sync_profile_post_count();

-- ============================================
-- 2. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'reply', 'like', 'trophy', 'mention'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own as read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Auto-notify on new reply
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  topic_author UUID;
  replier_name TEXT;
  topic_title TEXT;
BEGIN
  SELECT t.author_id, t.title INTO topic_author, topic_title FROM topics t WHERE t.id = NEW.topic_id;
  SELECT display_name INTO replier_name FROM profiles WHERE id = NEW.author_id;
  
  -- Notify topic author (if not self-reply)
  IF topic_author IS NOT NULL AND topic_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (topic_author, 'reply', 'Nouvelle réponse', 
      COALESCE(replier_name, 'Quelqu''un') || ' a répondu à « ' || topic_title || ' »',
      '/t/' || (SELECT slug FROM topics WHERE id = NEW.topic_id) || '#post-' || NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_reply ON posts;
CREATE TRIGGER notify_reply AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- Auto-notify on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  liker_name TEXT;
BEGIN
  SELECT p.author_id INTO post_author FROM posts p WHERE p.id = NEW.post_id;
  SELECT display_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (post_author, 'like', 'Nouveau like',
      COALESCE(liker_name, 'Quelqu''un') || ' a aimé votre message',
      '/t/' || (SELECT t.slug FROM topics t JOIN posts p ON p.topic_id = t.id WHERE p.id = NEW.post_id) || '#post-' || NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_like ON likes;
CREATE TRIGGER notify_like AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Auto-notify on trophy earned
CREATE OR REPLACE FUNCTION public.notify_on_trophy()
RETURNS TRIGGER AS $$
DECLARE
  trophy_name TEXT;
BEGIN
  SELECT name INTO trophy_name FROM trophies WHERE id = NEW.trophy_id;
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (NEW.user_id, 'trophy', '🏆 Trophée débloqué !',
    'Vous avez obtenu le trophée « ' || trophy_name || ' »',
    '/u/' || (SELECT username FROM profiles WHERE id = NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_trophy ON user_trophies;
CREATE TRIGGER notify_trophy AFTER INSERT ON user_trophies
  FOR EACH ROW EXECUTE FUNCTION notify_on_trophy();

-- ============================================
-- 3. SUBSCRIPTIONS (Follow topics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_topic ON public.subscriptions(topic_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscriptions viewable by owner" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can subscribe" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsubscribe" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. BOOKMARKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookmarks viewable by owner" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FIX: like_count on profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET like_count = (
      SELECT COUNT(*) FROM likes WHERE post_id IN (SELECT id FROM posts WHERE author_id = (
        SELECT author_id FROM posts WHERE id = NEW.post_id
      ))
    ) WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET like_count = (
      SELECT COUNT(*) FROM likes WHERE post_id IN (SELECT id FROM posts WHERE author_id = (
        SELECT author_id FROM posts WHERE id = OLD.post_id
      ))
    ) WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_likes ON likes;
CREATE TRIGGER sync_profile_likes AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION sync_profile_like_count();
