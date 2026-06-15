-- Site-wide branding and content settings (singleton row)

CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'Zëri i Qytetarit',
  platform_tagline TEXT NOT NULL DEFAULT 'Zëri i qytetarëve',
  site_title TEXT NOT NULL DEFAULT 'Zëri i Qytetarit',
  site_description TEXT NOT NULL DEFAULT 'Platforma digjitale për raportim, dokumentim dhe ndjekje të problemeve në jetën e përditshme.',
  logo_url TEXT,
  logo_abbr TEXT NOT NULL DEFAULT 'ZQ',
  favicon_url TEXT,
  hero_badge TEXT NOT NULL DEFAULT 'Platforma e qytetarëve të Kosovës',
  hero_title TEXT,
  hero_description TEXT,
  hero_cta_primary TEXT NOT NULL DEFAULT 'Raporto Problem',
  hero_cta_secondary TEXT NOT NULL DEFAULT 'Shiko Hartën',
  footer_description TEXT NOT NULL DEFAULT 'Platforma digjitale për transparencë, përgjegjësi dhe përmirësim të shërbimeve publike në Kosovë.',
  footer_tagline TEXT NOT NULL DEFAULT 'Platforma për qytetarët e Kosovës',
  mission_text TEXT NOT NULL DEFAULT 'Të fuqizojmë qytetarët për të raportuar, ndjekur dhe zgjidhur problemet e përditshme.',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON site_settings TO anon, authenticated;
GRANT UPDATE ON site_settings TO authenticated;
