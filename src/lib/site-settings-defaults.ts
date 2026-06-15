import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import type { SiteSettings } from '@/lib/types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  platform_name: APP_NAME,
  platform_tagline: 'Zëri i qytetarëve',
  site_title: APP_NAME,
  site_description: APP_DESCRIPTION,
  logo_url: null,
  logo_abbr: 'ZQ',
  favicon_url: null,
  hero_badge: 'Platforma e qytetarëve të Kosovës',
  hero_title: null,
  hero_description: null,
  hero_cta_primary: 'Raporto Problem',
  hero_cta_secondary: 'Shiko Hartën',
  footer_description:
    'Platforma digjitale për transparencë, përgjegjësi dhe përmirësim të shërbimeve publike në Kosovë.',
  footer_tagline: 'Platforma për qytetarët e Kosovës',
  mission_text:
    'Të fuqizojmë qytetarët për të raportuar, ndjekur dhe zgjidhur problemet e përditshme.',
  updated_at: new Date().toISOString(),
  updated_by: null,
};

export function getHeroTitle(settings: SiteSettings): string {
  return settings.hero_title || settings.platform_name;
}

export function getHeroDescription(settings: SiteSettings): string {
  return settings.hero_description || settings.site_description;
}
