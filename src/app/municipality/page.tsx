'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Timer,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BreakdownCard } from '@/components/municipality/BreakdownCard';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Report, ReportStatus } from '@/lib/types';

interface MunicipalityStats {
  jurisdiction: string;
  municipalityName: string;
  totalReports: number;
  pendingReports: number;
  activeReports: number;
  resolvedReports: number;
  resolutionRate: number;
  averageResolutionTimeLabel: string;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  districtCounts: Record<string, number>;
}

export default function MunicipalityDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<MunicipalityStats | null>(null);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [statsRes, pendingRes, recentRes] = await Promise.all([
      fetch('/api/municipality/stats'),
      fetch('/api/municipality/reports?status=pending_review&limit=15'),
      fetch('/api/municipality/reports?limit=20'),
    ]);

    if (statsRes.status === 403 || pendingRes.status === 403) {
      router.push('/');
      return;
    }

    if (statsRes.status === 400) {
      const data = await statsRes.json();
      setError(data.error || 'Konfigurimi i komunes mungon');
      setLoading(false);
      return;
    }

    if (statsRes.ok) setStats(await statsRes.json());
    if (pendingRes.ok) setPendingReports(await pendingRes.json());
    if (recentRes.ok) setRecentReports(await recentRes.json());
    setLoading(false);
  }

  function ReportList({ reports }: { reports: Report[] }) {
    return (
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} padding="md" className="card-hover">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
              <h3 className="font-semibold text-slate-900 leading-snug break-words min-w-0">
                {report.title}
              </h3>
              <Badge
                className={cn(
                  REPORT_STATUS_COLORS[report.status as ReportStatus],
                  'self-start shrink-0'
                )}
              >
                {REPORT_STATUS_LABELS[report.status as ReportStatus]}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 mb-2">{report.description}</p>
            <p className="text-xs text-slate-400 mb-3">
              {report.category?.name && `${report.category.name} · `}
              {report.city && `${report.city} · `}
              {formatRelativeDate(report.created_at)}
            </p>
            <Link href={`/reports/${report.id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-3.5 w-3.5" /> Shiko & Menaxho
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="page-container-narrow py-10 animate-fade-in">
        <Card padding="lg" className="border-amber-200 bg-amber-50/50">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h2 className="font-bold text-slate-900">Konfigurimi i Komunes</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{error}</p>
              <p className="text-xs text-slate-500 mt-3">
                Administratori duhet të caktojë qytetin/rajonin në profilin tuaj (p.sh. &quot;Prishtinë&quot;).
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Portali i Komunes"
        title={stats.municipalityName || `Komuna — ${stats.jurisdiction}`}
        description={`Paneli analitik për rajonin ${stats.jurisdiction}. Ndiqni raportimet, zgjidhjet dhe performancën e shërbimeve publike.`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
          <Landmark className="h-6 w-6 text-emerald-700" />
        </div>
      </PageHeader>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <strong>Rajoni juaj:</strong> {stats.jurisdiction} ·{' '}
        <span className="text-emerald-700">
          {stats.totalReports} raportime totale · {stats.resolutionRate}% shkalla e zgjidhjes
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
        <StatCard icon={FileText} label="Raportime Totale" value={stats.totalReports} />
        <StatCard
          icon={Clock}
          label="Në Pritje"
          value={stats.pendingReports}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Shkalla e Zgjidhjes"
          value={`${stats.resolutionRate}%`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={Timer}
          label="Koha Mes. e Zgjidhjes"
          value={stats.averageResolutionTimeLabel}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <StatCard
          icon={CheckCircle}
          label="Të Zgjidhura"
          value={stats.resolvedReports}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={FileText}
          label="Aktive (në proces)"
          value={stats.activeReports}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <BreakdownCard
          title="Sipas Kategorisë"
          data={stats.categoryCounts}
        />
        <BreakdownCard
          title="Sipas Statusit"
          data={stats.statusCounts}
          valueFormatter={(key) =>
            REPORT_STATUS_LABELS[key as ReportStatus] || key
          }
        />
        <BreakdownCard
          title="Raportime sipas Rajonit"
          data={stats.districtCounts}
          highlightKey={stats.jurisdiction}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Raportime në Pritje — {stats.jurisdiction}
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {pendingReports.length}
          </span>
        </h2>

        {pendingReports.length > 0 ? (
          <ReportList reports={pendingReports} />
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="Nuk ka raportime në pritje"
            description={`Të gjitha raportimet e reja në ${stats.jurisdiction} janë rishikuar, ose ende nuk ka raportime.`}
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Të gjitha Raportimet — {stats.jurisdiction}
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {recentReports.length}
          </span>
        </h2>

        {recentReports.length > 0 ? (
          <ReportList reports={recentReports} />
        ) : (
          <EmptyState
            icon={FileText}
            title="Nuk ka raportime në këtë rajon"
            description={`Ende nuk ka raportime për ${stats.jurisdiction}. Sigurohuni që profili i komunes përdor të njëjtin emër qyteti si raportimet (p.sh. &quot;Prishtinë&quot;).`}
          />
        )}
      </div>

      <Card padding="md" className="mt-10 border-slate-200 bg-slate-50/80">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>Abonimi i Komunes:</strong> Ky portal ofron transparencë dhe analitikë në kohë reale
          për vendimmarrje më të shpejtë. Kontaktoni ekipin tonë për licencë vjetore dhe integrime
          shtesë (njoftime, eksport raportesh, API).
        </p>
      </Card>
    </div>
  );
}
