import type { BusinessResponse, Report, ReportPhoto } from './types';

export interface BusinessReputationMetrics {
  totalReports: number;
  resolvedReports: number;
  resolutionRate: number;
  averageResponseTimeHours: number | null;
  averageResponseTimeLabel: string;
  reputationScore: number;
}

export interface BusinessResponseWithReport extends BusinessResponse {
  report?: Pick<Report, 'id' | 'title' | 'status' | 'created_at'> | null;
}

function formatDurationHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours)} orë`;
  const days = Math.round(hours / 24);
  return `${days} ditë`;
}

/**
 * Reputation score 0–100 from resolution rate and response speed.
 */
export function computeReputationScore(
  totalReports: number,
  resolvedReports: number,
  averageResponseTimeHours: number | null
): number {
  if (totalReports === 0) return 100;

  const resolutionRate = resolvedReports / totalReports;
  let score = 45 + resolutionRate * 45;

  if (averageResponseTimeHours !== null) {
    if (averageResponseTimeHours <= 24) score += 10;
    else if (averageResponseTimeHours <= 72) score += 5;
    else if (averageResponseTimeHours > 168) score -= 8;
    else if (averageResponseTimeHours > 336) score -= 15;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function computeAverageResponseTimeHours(
  reports: Pick<Report, 'id' | 'created_at'>[],
  responses: BusinessResponse[]
): number | null {
  if (reports.length === 0 || responses.length === 0) return null;

  const reportCreated = new Map(reports.map((r) => [r.id, new Date(r.created_at).getTime()]));
  const firstResponseByReport = new Map<string, number>();

  for (const response of responses) {
    const reportTime = reportCreated.get(response.report_id);
    if (!reportTime) continue;
    const responseTime = new Date(response.created_at).getTime();
    const existing = firstResponseByReport.get(response.report_id);
    if (existing === undefined || responseTime < existing) {
      firstResponseByReport.set(response.report_id, responseTime);
    }
  }

  if (firstResponseByReport.size === 0) return null;

  let totalHours = 0;
  for (const [reportId, responseMs] of firstResponseByReport) {
    const reportMs = reportCreated.get(reportId)!;
    totalHours += (responseMs - reportMs) / (1000 * 60 * 60);
  }

  return totalHours / firstResponseByReport.size;
}

export function buildReputationMetrics(
  reports: Pick<Report, 'id' | 'status' | 'created_at'>[],
  responses: BusinessResponse[]
): BusinessReputationMetrics {
  const totalReports = reports.length;
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
  const averageResponseTimeHours = computeAverageResponseTimeHours(reports, responses);
  const reputationScore = computeReputationScore(
    totalReports,
    resolvedReports,
    averageResponseTimeHours
  );

  return {
    totalReports,
    resolvedReports,
    resolutionRate,
    averageResponseTimeHours,
    averageResponseTimeLabel:
      averageResponseTimeHours !== null
        ? formatDurationHours(averageResponseTimeHours)
        : '—',
    reputationScore,
  };
}

export function collectReportPhotos(
  reports: (Pick<Report, 'id'> & { photos?: ReportPhoto[] })[],
  limit = 12
): ReportPhoto[] {
  const photos: ReportPhoto[] = [];
  for (const report of reports) {
    for (const photo of report.photos || []) {
      photos.push(photo);
      if (photos.length >= limit) return photos;
    }
  }
  return photos;
}

export function reputationScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

export function reputationScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}
