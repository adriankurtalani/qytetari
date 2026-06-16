import type { SupabaseClient } from '@supabase/supabase-js';
import { generateUniqueBusinessSlug } from './business-slug';
import {
  buildReputationMetrics,
  collectReportPhotos,
  type BusinessReputationMetrics,
  type BusinessResponseWithReport,
} from './business-reputation';
import { PUBLIC_REPORT_STATUSES } from './constants';
import type { Business, Report, ReportPhoto } from './types';

export interface BusinessPublicProfile {
  business: Business;
  metrics: BusinessReputationMetrics;
  reports: Report[];
  photos: ReportPhoto[];
  responses: BusinessResponseWithReport[];
}

export async function fetchBusinessPublicProfile(
  supabase: SupabaseClient,
  business: Business
): Promise<BusinessPublicProfile> {
  const { data: reports } = await supabase
    .from('reports')
    .select('*, photos:report_photos(*)')
    .or(`business_id.eq.${business.id},business_name.ilike.%${business.name}%`)
    .in('status', PUBLIC_REPORT_STATUSES)
    .order('created_at', { ascending: false });

  const reportList = (reports || []) as Report[];

  const { data: responses } = await supabase
    .from('business_responses')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const responseList = responses || [];

  const reportIds = new Set(reportList.map((r) => r.id));
  const responsesWithReports: BusinessResponseWithReport[] = responseList.map((r) => ({
    ...r,
    report: reportList.find((rep) => rep.id === r.report_id) ?? null,
  }));

  const metrics = buildReputationMetrics(reportList, responseList);
  const photos = collectReportPhotos(reportList);

  return {
    business: { ...business, reputation_score: metrics.reputationScore },
    metrics,
    reports: reportList,
    photos,
    responses: responsesWithReports.filter(
      (r) => !r.report_id || reportIds.has(r.report_id)
    ),
  };
}

export async function ensureBusinessSlug(
  supabase: SupabaseClient,
  business: Business
): Promise<string> {
  if (business.slug) return business.slug;

  const slug = await generateUniqueBusinessSlug(
    supabase,
    business.name,
    business.city || ''
  );

  await supabase.from('businesses').update({ slug }).eq('id', business.id);
  return slug;
}
