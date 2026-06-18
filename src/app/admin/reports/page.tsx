'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackLink } from '@/components/ui/BackLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { CitizenTrustBadge } from '@/components/profile/CitizenTrustBadge';
import { ReportWeeklyPinButton } from '@/components/reports/ReportWeeklyPinButton';
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  WORKFLOW_STATUSES,
} from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import { getReportPublicPath } from '@/lib/report-url';
import type { Report, ReportStatus } from '@/lib/types';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Të gjitha statuset' },
  ...WORKFLOW_STATUSES.map((s) => ({
    value: s,
    label: REPORT_STATUS_LABELS[s],
  })),
];

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDrafts, setStatusDrafts] = useState<Record<string, ReportStatus>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  function handlePinToggle(reportId: string, pinned: boolean) {
    setReports((prev) =>
      prev.map((r) => ({
        ...r,
        is_weekly_spotlight: r.id === reportId ? pinned : pinned ? false : r.is_weekly_spotlight,
      }))
    );
    setToast({
      message: pinned
        ? 'Raporti u vendos si Raporti i javës'
        : 'Raporti u hoq nga Raporti i javës',
      type: 'success',
    });
  }

  const pinnedReport = reports.find((r) => r.is_weekly_spotlight);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
    if (res.status === 403) {
      router.push('/');
      return;
    }
    if (res.ok) {
      const data: Report[] = await res.json();
      setReports(data);
      setStatusDrafts(
        Object.fromEntries(data.map((r) => [r.id, r.status])) as Record<string, ReportStatus>
      );
    }
    setLoading(false);
  }, [router, statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function updateStatus(reportId: string, status: ReportStatus) {
    setUpdatingId(reportId);
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    });
    const data = await res.json();

    if (!res.ok) {
      setToast({ message: data.error || 'Gabim gjatë përditësimit', type: 'error' });
      setUpdatingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
    setStatusDrafts((prev) => ({ ...prev, [reportId]: status }));

    if (statusFilter !== 'all' && statusFilter !== status) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }

    setToast({ message: 'Statusi u përditësua', type: 'success' });
    setUpdatingId(null);
  }

  async function deleteReport(reportId: string, title: string) {
    const confirmed = window.confirm(
      `Jeni i sigurt që doni ta fshini raportimin "${title}"?\n\nKy veprim nuk mund të kthehet.`
    );
    if (!confirmed) return;

    setDeletingId(reportId);
    const res = await fetch('/api/admin/reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setToast({ message: data.error || 'Gabim gjatë fshirjes', type: 'error' });
      setDeletingId(null);
      return;
    }

    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setToast({ message: 'Raportimi u fshi', type: 'success' });
    setDeletingId(null);
  }

  if (loading && reports.length === 0) return <LoadingSpinner />;

  return (
    <>
      <div className="page-container py-6 sm:py-10 max-w-6xl animate-fade-in">
        <BackLink href="/admin" label="Kthehu te paneli" />

        <PageHeader
          badge="Administrim"
          title="Menaxhimi i Raportimeve"
          description="Rishikoni, ndryshoni statusin ose fshini raportimet nga një vend."
        >
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-50">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
        </PageHeader>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-end gap-4">
          <Select
            label="Filtro sipas statusit"
            className="w-full sm:max-w-xs"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <p className="text-sm text-slate-500 pb-1">
            {reports.length} raportime
          </p>
        </div>

        {pinnedReport && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Star className="h-5 w-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-amber-900">Raporti i javës (i pinuar)</p>
              <p className="text-amber-800 mt-0.5 truncate">
                #{pinnedReport.report_number} · {pinnedReport.title}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {reports.map((report) => {
            const photo = report.photos?.[0];
            const draftStatus = statusDrafts[report.id] ?? report.status;
            const isUpdating = updatingId === report.id;
            const isDeleting = deletingId === report.id;

            return (
              <Card
                key={report.id}
                padding="md"
                className={cn(
                  'overflow-hidden',
                  report.is_weekly_spotlight && 'ring-2 ring-amber-300 border-amber-200'
                )}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {photo?.url && (
                    <div className="relative w-full lg:w-36 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src={photo.url}
                        alt={report.title}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 leading-snug break-words">
                        <span className="text-blue-600">#{report.report_number}</span> {report.title}
                      </h3>
                      <Badge
                        className={cn(
                          REPORT_STATUS_COLORS[report.status],
                          'self-start shrink-0'
                        )}
                      >
                        {REPORT_STATUS_LABELS[report.status]}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {report.city}
                      </span>
                      <span>{formatRelativeDate(report.created_at)}</span>
                      {report.category && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                          {report.category.name}
                        </span>
                      )}
                      {report.profile?.citizen_score != null && (
                        <CitizenTrustBadge
                          citizenScore={report.profile.citizen_score}
                          approvedCount={report.profile.approved_reports_count}
                          rejectedCount={report.profile.rejected_reports_count}
                          size="inline"
                          className="inline-flex"
                        />
                      )}
                    </div>

                    {report.ai_recommendation && (
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5 mb-3 inline-block">
                        AI:{' '}
                        {(report.ai_recommendation as { approved: boolean }).approved
                          ? 'Rekomandon aprovimin'
                          : 'Rekomandon refuzimin'}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                      <Select
                        label="Statusi"
                        className="flex-1 sm:max-w-xs"
                        options={WORKFLOW_STATUSES.map((s) => ({
                          value: s,
                          label: REPORT_STATUS_LABELS[s],
                        }))}
                        value={draftStatus}
                        onChange={(e) =>
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [report.id]: e.target.value as ReportStatus,
                          }))
                        }
                      />
                      <div className="flex flex-wrap items-end gap-2">
                        <Button
                          size="sm"
                          disabled={isUpdating || draftStatus === report.status}
                          onClick={() => updateStatus(report.id, draftStatus)}
                        >
                          {isUpdating ? 'Duke ruajtur...' : 'Përditëso'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => updateStatus(report.id, 'approved')}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Aprovo
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="gap-1"
                          onClick={() => updateStatus(report.id, 'rejected')}
                          disabled={isUpdating}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Refuzo
                        </Button>
                        <ReportWeeklyPinButton
                          reportId={report.id}
                          isPinned={!!report.is_weekly_spotlight}
                          onToggle={(pinned) => handlePinToggle(report.id, pinned)}
                        />
                        <Link href={getReportPublicPath(report.report_number)}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="h-3.5 w-3.5" /> Shiko
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="danger"
                          className="gap-1"
                          onClick={() => deleteReport(report.id, report.title)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isDeleting ? 'Duke fshirë...' : 'Fshi'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {reports.length === 0 && !loading && (
            <EmptyState
              icon={FileText}
              title="Nuk ka raportime"
              description="Nuk u gjet asnjë raportim për këtë filter."
            />
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
