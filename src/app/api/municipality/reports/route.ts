import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyMunicipality } from '@/lib/municipality-auth';
import { getCityFilterValues } from '@/lib/city-utils';

export async function GET(request: NextRequest) {
  const session = await verifyMunicipality();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const jurisdiction = session.profile.city?.trim();
  if (!jurisdiction) {
    return NextResponse.json({ error: 'Rajoni i komunes nuk është konfiguruar' }, { status: 400 });
  }

  const cityFilters = getCityFilterValues(jurisdiction);
  const status = new URL(request.url).searchParams.get('status');
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '30', 10), 100);

  const supabase = createServiceClient();

  let query = supabase
    .from('reports')
    .select('*, category:categories(*), photos:report_photos(id)')
    .in('city', cityFilters)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
