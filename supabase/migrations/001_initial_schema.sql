-- Zëri i Qytetarit - Initial Database Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('citizen', 'business', 'municipality', 'admin');
CREATE TYPE report_status AS ENUM ('pending_review', 'approved', 'rejected', 'in_progress', 'resolved');
CREATE TYPE vote_type AS ENUM ('support', 'disagree');
CREATE TYPE ban_type AS ENUM ('temporary', 'permanent');
CREATE TYPE subscription_tier AS ENUM ('free', 'verified', 'premium');
CREATE TYPE notification_type AS ENUM (
  'report_approved',
  'report_rejected',
  'new_comment',
  'status_changed',
  'business_response'
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  profile_photo_url TEXT,
  city TEXT,
  anonymous_mode BOOLEAN DEFAULT FALSE,
  role user_role DEFAULT 'citizen',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_tier subscription_tier DEFAULT 'free',
  reputation_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  business_name TEXT,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT NOT NULL,
  status report_status DEFAULT 'pending_review',
  ai_recommendation JSONB,
  ai_flagged BOOLEAN DEFAULT FALSE,
  support_count INTEGER DEFAULT 0,
  disagree_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Photos
CREATE TABLE report_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vote_user_unique UNIQUE (report_id, user_id),
  CONSTRAINT vote_anonymous_unique UNIQUE (report_id, anonymous_id),
  CONSTRAINT vote_identity_check CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Responses
CREATE TABLE business_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolution_evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP Bans
CREATE TABLE ip_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  ban_type ban_type NOT NULL DEFAULT 'temporary',
  expires_at TIMESTAMPTZ,
  violation_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_bans_address ON ip_bans(ip_address);

-- Banned Words (admin-managed)
CREATE TABLE banned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Ushqim & Restorante', 'food-restaurants', 'Cilësi e dobët e ushqimit, higjienë, shërbim jo profesional', 'utensils'),
  ('Ndërtim & Pasuri të Paluajtshme', 'construction-real-estate', 'Punime jo cilësore, defekte ndërtimore, siguri e ulët', 'building'),
  ('Infrastrukturë Publike', 'public-infrastructure', 'Gropa në rrugë, ndriçim, mbeturina, kanalizim', 'road'),
  ('Shërbime', 'services', 'Telekomunikacion, internet, energji, ujë', 'zap'),
  ('Institucione Publike', 'public-institutions', 'Komuna, shkolla, universitete, administratë', 'landmark');

-- Functions to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'support' THEN
      UPDATE reports SET support_count = support_count + 1 WHERE id = NEW.report_id;
    ELSE
      UPDATE reports SET disagree_count = disagree_count + 1 WHERE id = NEW.report_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'support' THEN
      UPDATE reports SET support_count = GREATEST(support_count - 1, 0) WHERE id = OLD.report_id;
    ELSE
      UPDATE reports SET disagree_count = GREATEST(disagree_count - 1, 0) WHERE id = OLD.report_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'support' AND NEW.vote_type = 'disagree' THEN
      UPDATE reports SET support_count = GREATEST(support_count - 1, 0), disagree_count = disagree_count + 1 WHERE id = NEW.report_id;
    ELSIF OLD.vote_type = 'disagree' AND NEW.vote_type = 'support' THEN
      UPDATE reports SET disagree_count = GREATEST(disagree_count - 1, 0), support_count = support_count + 1 WHERE id = NEW.report_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET comment_count = comment_count + 1 WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.report_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || REPLACE(substr(NEW.id::text, 1, 13), '-', '')
    )
  );
  RETURN NEW;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

-- Categories policies
CREATE POLICY "Categories are viewable" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reports policies
CREATE POLICY "Approved reports are public" ON reports FOR SELECT USING (
  status IN ('approved', 'in_progress', 'resolved') OR
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own pending reports" ON reports FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'municipality'))
);

-- Report photos policies
CREATE POLICY "Photos viewable with report" ON report_photos FOR SELECT USING (true);
CREATE POLICY "Anyone can upload photos" ON report_photos FOR INSERT WITH CHECK (true);

-- Votes policies
CREATE POLICY "Votes are viewable" ON votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (
  user_id = auth.uid() OR anonymous_id IS NOT NULL
);

-- Comments policies
CREATE POLICY "Comments are viewable" ON comments FOR SELECT USING (NOT is_flagged OR user_id = auth.uid());
CREATE POLICY "Verified users can comment" ON comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_verified = true)
);

-- Notifications policies
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Businesses policies
CREATE POLICY "Businesses are viewable" ON businesses FOR SELECT USING (true);
CREATE POLICY "Owners manage businesses" ON businesses FOR ALL USING (owner_id = auth.uid());

-- Business responses policies
CREATE POLICY "Responses are viewable" ON business_responses FOR SELECT USING (true);
CREATE POLICY "Business owners respond" ON business_responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- Admin policies for moderation
CREATE POLICY "Admins manage reports" ON reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage ip bans" ON ip_bans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage banned words" ON banned_words FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Banned words viewable by service" ON banned_words FOR SELECT USING (true);

-- Storage bucket (create in Supabase dashboard: Storage → New bucket → report-photos, public)
-- Then run storage policies from 003_storage_policies.sql
