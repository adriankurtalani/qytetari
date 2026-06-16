import type { SupabaseClient } from '@supabase/supabase-js';
import type { Business } from './types';
import { generateUniqueBusinessSlug } from './business-slug';

/** Normalize for deduplication: lowercase, trimmed, collapsed whitespace. */
export function normalizeBusinessName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find an existing business by normalized name + city, or create an unclaimed record.
 * Links reports via business_id and increments report_count.
 */
export async function findOrCreateUnclaimedBusiness(
  supabase: SupabaseClient,
  businessName: string,
  city: string
): Promise<Business | null> {
  const trimmed = businessName.trim();
  if (!trimmed || !city) return null;

  const normalized = normalizeBusinessName(trimmed);

  const { data: existing } = await supabase
    .from('businesses')
    .select('*')
    .eq('normalized_name', normalized)
    .eq('city', city)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('businesses')
      .update({ report_count: (existing.report_count ?? 0) + 1 })
      .eq('id', existing.id);

    return { ...existing, report_count: (existing.report_count ?? 0) + 1 };
  }

  const { data: created, error } = await supabase
    .from('businesses')
    .insert({
      name: trimmed,
      slug: await generateUniqueBusinessSlug(supabase, trimmed, city),
      normalized_name: normalized,
      city,
      owner_id: null,
      claim_status: 'unclaimed',
      is_verified: false,
      report_count: 1,
    })
    .select()
    .single();

  if (error) {
    // Race: another request may have inserted first
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('businesses')
        .select('*')
        .eq('normalized_name', normalized)
        .eq('city', city)
        .single();

      if (retry) {
        await supabase
          .from('businesses')
          .update({ report_count: (retry.report_count ?? 0) + 1 })
          .eq('id', retry.id);
        return retry;
      }
    }
    console.error('findOrCreateUnclaimedBusiness:', error.message);
    return null;
  }

  return created;
}

export const CLAIM_STATUS_LABELS: Record<Business['claim_status'], string> = {
  unclaimed: 'Pa Pronar',
  pending_claim: 'Në Pritje të Verifikimit',
  verified: 'I Verifikuar',
  rejected: 'Kërkesa u Refuzua',
};

export const CLAIM_STATUS_COLORS: Record<Business['claim_status'], string> = {
  unclaimed: 'bg-slate-100 text-slate-700',
  pending_claim: 'bg-amber-100 text-amber-800',
  verified: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
};
