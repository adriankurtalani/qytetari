-- Public reputation profiles: unique URL slug per business

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_key ON businesses (slug) WHERE slug IS NOT NULL;

-- Backfill slugs from name (ASCII-safe); duplicates get city suffix
UPDATE businesses
SET slug = trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

UPDATE businesses SET slug = 'biznes-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR slug = '';

WITH numbered AS (
  SELECT
    id,
    slug,
    city,
    row_number() OVER (PARTITION BY slug ORDER BY created_at ASC) AS rn
  FROM businesses
)
UPDATE businesses b
SET slug = b.slug || '-' || trim(both '-' FROM regexp_replace(lower(coalesce(b.city, 'kosove')), '[^a-z0-9]+', '-', 'g'))
FROM numbered n
WHERE b.id = n.id AND n.rn > 1;

-- Final fallback for any remaining duplicates
WITH numbered AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY created_at ASC) AS rn
  FROM businesses
)
UPDATE businesses b
SET slug = b.slug || '-' || n.rn
FROM numbered n
WHERE b.id = n.id AND n.rn > 1;

ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;
