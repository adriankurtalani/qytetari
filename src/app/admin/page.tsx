'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  FileText,
  BarChart3,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Report } from '@/lib/types';

interface Stats {
  totalReports: number;
  pendingReports: number;
  totalUsers: number;
  totalComments: number;
  statusCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/reports?status=pending_review'),
      ]);

      if (statsRes.status === 403) {
        router.push('/');
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      if (reportsRes.ok) setPendingReports(await reportsRes.json());
      setLoading(false);
    }
    load();
  }, [router]);

  async function updateStatus(reportId: string, status: string) {
    await fetch('/api/admin/stats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    });
    setPendingReports((prev) => prev.filter((r) => r.id !== reportId));
    if (stats) {
      setStats({ ...stats, pendingReports: stats.pendingReports - 1 });
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Administrim"
        title="Paneli i Administratorit"
        description="Menaxhoni raportimet, përdoruesit dhe moderimin e përmbajtjes."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl hero-gradient shadow-md">
          <Shield className="h-6 w-6 text-white" />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <StatCard icon={FileText} label="Raportime" value={stats?.totalReports || 0} />
        <StatCard
          icon={Clock}
          label="Në Pritje"
          value={stats?.pendingReports || 0}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard icon={Users} label="Përdorues" value={stats?.totalUsers || 0} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={BarChart3} label="Komente" value={stats?.totalComments || 0} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8">
        <Link href="/admin/users" className="w-full sm:w-auto">
          <Button variant="outline" className="gap-2 shadow-sm w-full sm:w-auto min-h-[44px]">
            <Users className="h-4 w-4" /> Menaxho Përdoruesit
          </Button>
        </Link>
        <Link href="/admin/banned-words" className="w-full sm:w-auto">
          <Button variant="outline" className="gap-2 shadow-sm w-full sm:w-auto min-h-[44px]">
            <Ban className="h-4 w-4" /> Fjalët e Ndaluara
          </Button>
        </Link>
        <Link href="/admin/settings" className="w-full sm:w-auto">
          <Button variant="outline" className="gap-2 shadow-sm w-full sm:w-auto min-h-[44px]">
            <Settings className="h-4 w-4" /> Cilësimet e Platformës
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Raportime në Pritje
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pendingReports.length}
            </span>
          </h2>

          <div className="space-y-4">
            {pendingReports.map((report) => (
              <Card key={report.id} padding="md" className="card-hover">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 leading-snug break-words min-w-0">{report.title}</h3>
                  <Badge className={cn(REPORT_STATUS_COLORS[report.status], 'self-start shrink-0')}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {report.description}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  {report.city} · {formatRelativeDate(report.created_at)}
                </p>
                {report.ai_recommendation && (
                  <p className="text-xs font-medium text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5 mb-3 inline-block">
                    AI: {(report.ai_recommendation as { approved: boolean }).approved
                      ? 'Rekomandon aprovimin'
                      : 'Rekomandon refuzimin'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Button size="sm" onClick={() => updateStatus(report.id, 'approved')} className="gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Aprovo
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => updateStatus(report.id, 'rejected')} className="gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Refuzo
                  </Button>
                  <Link href={`/reports/${report.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="h-3.5 w-3.5" /> Shiko
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
            {pendingReports.length === 0 && (
              <EmptyState
                icon={CheckCircle}
                title="Asnjë raportim në pritje"
                description="Të gjitha raportimet janë rishikuar. Punë e mirë!"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <StatsBreakdown title="Sipas Statusit" data={stats?.statusCounts || {}} />
          <StatsBreakdown title="Qytetet më të Raportuara" data={stats?.cityCounts || {}} />
          <StatsBreakdown title="Sipas Kategorisë" data={stats?.categoryCounts || {}} />
        </div>
      </div>
    </div>
  );
}

function StatsBreakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 8);
  const max = sorted[0]?.[1] || 1;

  return (
    <Card padding="md">
      <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">{title}</h3>
      <div className="space-y-3">
        {sorted.map(([key, count]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 truncate pr-2">
                {REPORT_STATUS_LABELS[key as keyof typeof REPORT_STATUS_LABELS] || key}
              </span>
              <span className="font-semibold text-slate-900 shrink-0">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-slate-400">Nuk ka të dhëna.</p>
        )}
      </div>
    </Card>
  );
}
