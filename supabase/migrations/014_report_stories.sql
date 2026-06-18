-- Faza 4: Lajme / histori zgjidhjesh të kuratuara nga admini

CREATE TABLE report_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  report_status report_status NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX report_stories_published_idx ON report_stories (is_published, published_at DESC);
CREATE INDEX report_stories_report_id_idx ON report_stories (report_id);

CREATE TABLE report_story_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES report_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT story_like_user_unique UNIQUE (story_id, user_id),
  CONSTRAINT story_like_anonymous_unique UNIQUE (story_id, anonymous_id),
  CONSTRAINT story_like_identity_check CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE OR REPLACE FUNCTION update_story_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE report_stories SET like_count = like_count + 1 WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE report_stories SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER report_story_likes_count
  AFTER INSERT OR DELETE ON report_story_likes
  FOR EACH ROW EXECUTE FUNCTION update_story_like_count();

CREATE TRIGGER report_stories_updated_at
  BEFORE UPDATE ON report_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE report_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published stories are public"
  ON report_stories FOR SELECT
  USING (is_published = true);

CREATE POLICY "Story likes are public"
  ON report_story_likes FOR SELECT
  USING (true);
