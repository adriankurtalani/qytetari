import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyMunicipality } from '@/lib/municipality-auth';
import { buildMunicipalityStats } from '@/lib/municipality-stats';
import { getCanonicalCity, getCityFilterValues } from '@/lib/city-utils';

export async function GET() {
  const session = await verifyMunicipality();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const jurisdictionRaw = session.profile.city?.trim();
  if (!jurisdictionRaw) {
    return NextResponse.json(
      {
        error:
          'Komuna juaj nuk ka qytet/rajon të caktuar. Kontaktoni administratorin për ta konfiguruar profilin.',
        code: 'NO_JURISDICTION',
      },
      { status: 400 }
    );
  }

  const jurisdiction = getCanonicalCity(jurisdictionRaw);
  const cityFilters = getCityFilterValues(jurisdictionRaw);
  const supabase = createServiceClient();

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id, status, created_at, city, category_id, category:categories(name)')
    .in('city', cityFilters)
    .order('created_at', { ascending: false });

  if (reportsError) {
    return NextResponse.json({ error: reportsError.message }, { status: 500 });
  }

  const reportList = (reports || []).map((r) => ({
    ...r,
    category: Array.isArray(r.category) ? r.category[0] ?? null : r.category,
  }));
  const reportIds = reportList.map((r) => r.id);

  let timelineEvents: { report_id: string; status: string | null; created_at: string }[] = [];

  if (reportIds.length > 0) {
    const { data: events } = await supabase
      .from('report_timeline_events')
      .select('report_id, status, created_at')
      .in('report_id', reportIds);
    timelineEvents = events || [];
  }

  const { data: allByCity } = await supabase.from('reports').select('city');

  const districtCounts: Record<string, number> = {};
  allByCity?.forEach((r) => {
    if (r.city) {
      districtCounts[r.city] = (districtCounts[r.city] || 0) + 1;
    }
  });

  const stats = buildMunicipalityStats(
    jurisdiction,
    reportList,
    timelineEvents,
    districtCounts
  );

  return NextResponse.json({
    ...stats,
    municipalityName: session.profile.full_name || jurisdiction,
    jurisdictionRaw,
    cityFilters,
  });
}
