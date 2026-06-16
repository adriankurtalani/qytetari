import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_REPORT_STATUSES } from './constants';

export interface CitizenTrustTier {
  stars: number;
  label: string;
  labelSq: string;
  minScore: number;
}

export const CITIZEN_TRUST_TIERS: CitizenTrustTier[] = [
  { minScore: 81, stars: 5, label: 'Trusted Citizen', labelSq: 'Trusted Citizen' },
  { minScore: 61, stars: 4, label: 'Verified Citizen', labelSq: 'Qytetar i Verifikuar' },
  { minScore: 41, stars: 3, label: 'Trustworthy Citizen', labelSq: 'Qytetar i Besueshëm' },
  { minScore: 21, stars: 2, label: 'Active Citizen', labelSq: 'Qytetar Aktiv' },
  { minScore: 0, stars: 1, label: 'New Citizen', labelSq: 'Qytetar i Ri' },
];

export interface CitizenTrustStats {
  citizen_score: number;
  approved_reports_count: number;
  rejected_reports_count: number;
  citizen_activity_points: number;
  stars: number;
  label: string;
}

export function computeCitizenScore(params: {
  approvedReports: number;
  rejectedReports: number;
  commentCount: number;
  voteCount: number;
  isVerified: boolean;
}): { score: number; activityPoints: number } {
  const { approvedReports, rejectedReports, commentCount, voteCount, isVerified } = params;

  let activityPoints = 0;
  activityPoints += Math.min(commentCount * 2, 12);
  activityPoints += Math.min(voteCount, 8);
  if (isVerified) activityPoints += 5;

  let score = 45;
  score += approvedReports * 10;
  score -= rejectedReports * 18;
  score += activityPoints;

  // Slight penalty for high rejection ratio
  const totalModerated = approvedReports + rejectedReports;
  if (totalModerated >= 3 && rejectedReports / totalModerated > 0.5) {
    score -= 15;
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  return { score, activityPoints };
}

export function getCitizenTrustTier(score: number): CitizenTrustTier {
  return (
    CITIZEN_TRUST_TIERS.find((t) => score >= t.minScore) ??
    CITIZEN_TRUST_TIERS[CITIZEN_TRUST_TIERS.length - 1]
  );
}

export function getCitizenTrustDisplay(stats: {
  citizen_score: number;
  approved_reports_count?: number;
  rejected_reports_count?: number;
}): CitizenTrustStats {
  const tier = getCitizenTrustTier(stats.citizen_score);
  return {
    citizen_score: stats.citizen_score,
    approved_reports_count: stats.approved_reports_count ?? 0,
    rejected_reports_count: stats.rejected_reports_count ?? 0,
    citizen_activity_points: 0,
    stars: tier.stars,
    label: tier.labelSq,
  };
}

/** Recalculate and persist citizen trust from report/activity data. */
export async function recalculateCitizenTrust(
  supabase: SupabaseClient,
  userId: string
): Promise<CitizenTrustStats | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_verified, role')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'citizen') {
    return null;
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('status')
    .eq('user_id', userId);

  const approvedReports = (reports || []).filter((r) =>
    (PUBLIC_REPORT_STATUSES as string[]).includes(r.status)
  ).length;
  const rejectedReports = (reports || []).filter((r) => r.status === 'rejected').length;

  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: voteCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { score, activityPoints } = computeCitizenScore({
    approvedReports,
    rejectedReports,
    commentCount: commentCount || 0,
    voteCount: voteCount || 0,
    isVerified: profile.is_verified,
  });

  await supabase
    .from('profiles')
    .update({
      citizen_score: score,
      approved_reports_count: approvedReports,
      rejected_reports_count: rejectedReports,
      citizen_activity_points: activityPoints,
    })
    .eq('id', userId);

  const tier = getCitizenTrustTier(score);
  return {
    citizen_score: score,
    approved_reports_count: approvedReports,
    rejected_reports_count: rejectedReports,
    citizen_activity_points: activityPoints,
    stars: tier.stars,
    label: tier.labelSq,
  };
}

export function renderTrustStars(stars: number, max = 5): string {
  return '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, max - stars));
}
