import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const city = searchParams.get('city');
  const status = searchParams.get('status') || 'unclaimed';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

  const supabase = await createClient();

  let query = supabase
    .from('businesses')
    .select('id, slug, name, city, claim_status, is_verified, report_count, created_at, reputation_score')
    .order('report_count', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('claim_status', status);
  }

  if (city) {
    query = query.eq('city', city);
  }

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
