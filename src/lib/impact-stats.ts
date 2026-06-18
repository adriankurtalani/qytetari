import type { SupabaseClient } from '@supabase/supabase-js';
import { LAUNCH_CITY, PUBLIC_REPORT_STATUSES } from './constants';
import { distanceKm } from './map-utils';
import type { Report, ReportStatus } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NEARBY_RADIUS_KM = 0.3;

const PENDING_STATUSES: ReportStatus[] = [
  'approved',
  'in_progress',
  'waiting_for_response',
];

export interface WeeklyImpactStats {
  approvedThisWeek: number;
  resolvedThisWeek: number;
  stillPending: number;
}

export interface RelatedReportContext {
  nearbyCount: number;
  categoryCount: number;
  relatedReports: Report[];
}

function weekAgoIso(): string {
  return new Date(Date.now() - WEEK_MS).toISOString();
}

const REPORT_LIST_SELECT = '*, category:categories(*), photos:report_photos(*)';

export async function getWeeklyImpactStats(
  supabase: SupabaseClient,
  city: string = LAUNCH_CITY
): Promise<WeeklyImpactStats> {
  const since = weekAgoIso();

  const { count: approvedThisWeek } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('city', city)
    .in('status', PUBLIC_REPORT_STATUSES)
    .gte('created_at', since);

  const { count: resolvedThisWeek } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('city', city)
    .eq('status', 'resolved')
    .gte('updated_at', since);

  const { count: stillPending } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('city', city)
    .in('status', PENDING_STATUSES);

  return {
    approvedThisWeek: approvedThisWeek || 0,
    resolvedThisWeek: resolvedThisWeek || 0,
    stillPending: stillPending || 0,
  };
}

export async function getWeeklySpotlightReport(
  supabase: SupabaseClient,
  city: string = LAUNCH_CITY
): Promise<Report | null> {
  const { data: pinned } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .eq('city', city)
    .eq('is_weekly_spotlight', true)
    .in('status', PUBLIC_REPORT_STATUSES)
    .maybeSingle();

  if (pinned) return pinned as Report;

  const since = weekAgoIso();

  const { data } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .eq('city', city)
    .in('status', PUBLIC_REPORT_STATUSES)
    .gte('created_at', since)
    .order('support_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (data?.[0]) return data[0] as Report;

  const { data: fallback } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .eq('city', city)
    .in('status', PUBLIC_REPORT_STATUSES)
    .order('support_count', { ascending: false })
    .limit(1);

  return (fallback?.[0] as Report) || null;
}

export async function getRecentlyResolvedReports(
  supabase: SupabaseClient,
  city: string = LAUNCH_CITY,
  limit = 6
): Promise<Report[]> {
  const { data } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .eq('city', city)
    .eq('status', 'resolved')
    .order('updated_at', { ascending: false })
    .limit(limit);

  return (data as Report[]) || [];
}

export async function getRelatedReportContext(
  supabase: SupabaseClient,
  report: Pick<
    Report,
    'id' | 'category_id' | 'city' | 'latitude' | 'longitude' | 'business_name'
  >
): Promise<RelatedReportContext> {
  if (!report.category_id) {
    return { nearbyCount: 0, categoryCount: 0, relatedReports: [] };
  }

  const { data: peers } = await supabase
    .from('reports')
    .select(REPORT_LIST_SELECT)
    .eq('city', report.city)
    .eq('category_id', report.category_id)
    .in('status', PUBLIC_REPORT_STATUSES)
    .neq('id', report.id)
    .order('support_count', { ascending: false })
    .limit(30);

  const allPeers = (peers as Report[]) || [];

  const nearbyPeers = allPeers.filter(
    (peer) =>
      distanceKm(report.latitude, report.longitude, peer.latitude, peer.longitude) <=
      NEARBY_RADIUS_KM
  );

  const businessPeers = report.business_name
    ? allPeers.filter(
        (peer) =>
          peer.business_name &&
          peer.business_name.toLowerCase() === report.business_name!.toLowerCase()
      )
    : [];

  const relatedIds = new Set<string>();
  const relatedReports: Report[] = [];

  for (const peer of [...nearbyPeers, ...businessPeers, ...allPeers]) {
    if (relatedIds.has(peer.id)) continue;
    relatedIds.add(peer.id);
    relatedReports.push(peer);
    if (relatedReports.length >= 4) break;
  }

  return {
    nearbyCount: nearbyPeers.length,
    categoryCount: allPeers.length,
    relatedReports,
  };
}
