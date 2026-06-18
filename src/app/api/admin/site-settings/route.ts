import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings-defaults';
import type { SiteSettingsUpdate } from '@/lib/types';

const ALLOWED_FIELDS: (keyof SiteSettingsUpdate)[] = [
  'platform_name',
  'platform_tagline',
  'site_title',
  'site_description',
  'logo_url',
  'logo_abbr',
  'favicon_url',
  'hero_badge',
  'hero_title',
  'hero_description',
  'hero_cta_primary',
  'hero_cta_secondary',
  'footer_description',
  'footer_tagline',
  'mission_text',
];

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      // Table not migrated yet — return defaults so the admin UI still loads
      if (error.code === '42P01' || error.message.includes('site_settings')) {
        return NextResponse.json({ ...DEFAULT_SITE_SETTINGS, _needsMigration: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...DEFAULT_SITE_SETTINGS, ...data });
  } catch {
    return NextResponse.json({ ...DEFAULT_SITE_SETTINGS, _needsMigration: true });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, string | null> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const value = body[field];
      if (value === null || typeof value === 'string') {
        updates[field] = value === '' ? null : value;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nuk ka fusha për përditësim' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: existing } = await serviceClient
    .from('site_settings')
    .select('id')
    .eq('id', 1)
    .maybeSingle();

  let data;
  let error;

  if (existing) {
    ({ data, error } = await serviceClient
      .from('site_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .eq('id', 1)
      .select()
      .single());
  } else {
    const { id: _id, updated_at: _ua, updated_by: _ub, ...defaults } = DEFAULT_SITE_SETTINGS;
    ({ data, error } = await serviceClient
      .from('site_settings')
      .insert({
        id: 1,
        ...defaults,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .select()
      .single());
  }

  if (error) {
    if (error.code === '42P01' || error.message.includes('site_settings')) {
      return NextResponse.json(
        { error: 'Tabela site_settings nuk ekziston. Ekzekutoni migrimin 005 në Supabase SQL Editor.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag('site-settings', 'max');
  revalidatePath('/', 'layout');

  return NextResponse.json({ ...DEFAULT_SITE_SETTINGS, ...data });
}
