import type { SupabaseClient } from '@supabase/supabase-js';

/** Slug-safe business name (supports Albanian characters). */
export function slugifyBusinessName(name: string): string {
  let s = name
    .toLowerCase()
    .trim()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  s = s
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return s || 'biznes';
}

export function slugifyCity(city: string): string {
  return slugifyBusinessName(city);
}

/** Generate a globally unique slug for a new business. */
export async function generateUniqueBusinessSlug(
  supabase: SupabaseClient,
  name: string,
  city: string
): Promise<string> {
  const base = slugifyBusinessName(name);
  let candidate = base;
  let attempt = 0;

  while (attempt < 20) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!existing) return candidate;

    attempt += 1;
    if (attempt === 1 && city) {
      candidate = `${base}-${slugifyCity(city)}`;
    } else {
      candidate = `${base}-${attempt}`;
    }
  }

  return `${base}-${Date.now().toString(36)}`;
}

export async function getBusinessBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}
