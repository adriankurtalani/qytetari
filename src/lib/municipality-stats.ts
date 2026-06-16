import type { Report } from './types';

function formatDurationHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours)} orë`;
  const days = Math.round(hours / 24);
  return `${days} ditë`;
}

export interface MunicipalityDashboardStats {
  jurisdiction: string;
  totalReports: number;
  pendingReports: number;
  activeReports: number;
  resolvedReports: number;
  resolutionRate: number;
  averageResolutionTimeHours: number | null;
  averageResolutionTimeLabel: string;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  districtCounts: Record<string, number>;
}

type TimelineSlice = {
  report_id: string;
  status: string | null;
  created_at: string;
};

export function computeAverageResolutionTimeHours(
  reports: Pick<Report, 'id' | 'created_at' | 'status'>[],
  timelineEvents: TimelineSlice[]
): number | null {
  const resolvedReports = reports.filter((r) => r.status === 'resolved');
  if (resolvedReports.length === 0) return null;

  const reportCreated = new Map(
    resolvedReports.map((r) => [r.id, new Date(r.created_at).getTime()])
  );

  const resolvedAt = new Map<string, number>();

  for (const event of timelineEvents) {
    if (event.status !== 'resolved') continue;
    const t = new Date(event.created_at).getTime();
    const prev = resolvedAt.get(event.report_id);
    if (prev === undefined || t < prev) {
      resolvedAt.set(event.report_id, t);
    }
  }

  let totalHours = 0;
  let count = 0;

  for (const [reportId, createdMs] of reportCreated) {
    const resolvedMs = resolvedAt.get(reportId);
    if (resolvedMs !== undefined) {
      totalHours += (resolvedMs - createdMs) / (1000 * 60 * 60);
      count += 1;
    }
  }

  // Fallback: use report updated_at proxy when no timeline event
  if (count === 0) {
    return null;
  }

  return totalHours / count;
}

export function buildMunicipalityStats(
  jurisdiction: string,
  reports: (Pick<Report, 'id' | 'status' | 'created_at' | 'city' | 'category_id'> & {
    category?: { name: string } | null;
  })[],
  timelineEvents: TimelineSlice[],
  allDistrictCounts: Record<string, number>
): MunicipalityDashboardStats {
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'pending_review').length;
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length;
  const activeReports = reports.filter((r) =>
    ['approved', 'in_progress', 'waiting_for_response'].includes(r.status)
  ).length;

  const closedDenominator = reports.filter((r) => r.status !== 'rejected').length;
  const resolutionRate =
    closedDenominator > 0 ? Math.round((resolvedReports / closedDenominator) * 100) : 0;

  const averageResolutionTimeHours = computeAverageResolutionTimeHours(reports, timelineEvents);

  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const report of reports) {
    statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    const catName = report.category?.name || 'Pa kategori';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  }

  return {
    jurisdiction,
    totalReports,
    pendingReports,
    activeReports,
    resolvedReports,
    resolutionRate,
    averageResolutionTimeHours,
    averageResolutionTimeLabel:
      averageResolutionTimeHours !== null
        ? formatDurationHours(averageResolutionTimeHours)
        : '—',
    statusCounts,
    categoryCounts,
    districtCounts: allDistrictCounts,
  };
}
