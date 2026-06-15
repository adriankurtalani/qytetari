import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import {
  DEFAULT_SITE_SETTINGS,
  getHeroDescription,
  getHeroTitle,
} from '@/lib/site-settings-defaults';
import type { SiteSettings } from '@/lib/types';

export { DEFAULT_SITE_SETTINGS, getHeroTitle, getHeroDescription };

function mergeWithDefaults(row: Partial<SiteSettings> | null): SiteSettings {
  if (!row) return DEFAULT_SITE_SETTINGS;
  return { ...DEFAULT_SITE_SETTINGS, ...row };
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_SITE_SETTINGS;
    return mergeWithDefaults(data as SiteSettings);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export const getSiteSettings = unstable_cache(
  fetchSiteSettings,
  ['site-settings'],
  { revalidate: 60, tags: ['site-settings'] }
);
