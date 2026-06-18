'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Star,
  MessageSquare,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { getReportPublicPath } from '@/lib/report-url';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Business, Report } from '@/lib/types';

interface BusinessData {
  business: Business | null;
  reports: Report[];
  metrics: {
    totalReports: number;
    resolvedReports: number;
    reputationScore: number;
  };
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await fetch('/api/business');
    if (res.status === 401) {
      router.push('/auth/login');
      return;
    }
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  async function respondToReport(reportId: string) {
    await fetch('/api/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'respond',
        report_id: reportId,
        content: responseText,
      }),
    });
    setRespondingTo(null);
    setResponseText('');
    loadData();
  }

  async function markResolved(reportId: string) {
    await fetch('/api/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', report_id: reportId }),
    });
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  if (!data?.business) {
    return (
      <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
        <PageHeader
          badge="Biznes"
          title="Paneli i Biznesit"
          description="Nuk keni një biznes të lidhur me llogarinë tuaj."
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
        </PageHeader>

        <Card className="mt-8" padding="md">
          <p className="text-sm text-slate-600 leading-relaxed">
            Kontaktoni administratorin nëse jeni pronar biznesi dhe keni nevojë për qasje në panel.
          </p>
        </Card>
      </div>
    );
  }

  const { business, reports, metrics } = data;

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Biznes"
        title={business.name}
        description={business.city || 'Paneli i biznesit tuaj'}
      >
        <div className="flex items-center gap-3">
          {business.is_verified && (
            <Badge className="bg-blue-100 text-blue-800">I Verifikuar</Badge>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <StatCard icon={MessageSquare} label="Raportime" value={metrics.totalReports} />
        <StatCard
          icon={CheckCircle}
          label="Të Zgjidhura"
          value={metrics.resolvedReports}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={Star}
          label="Reputacioni"
          value={metrics.reputationScore}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Raportimet që Lidhen me Biznesin
        </h2>

        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} padding="md" className="card-hover">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                  <Link
                    href={getReportPublicPath(report.report_number)}
                    className="font-semibold text-slate-900 hover:text-blue-600 leading-snug break-words min-w-0"
                  >
                    {report.title}
                  </Link>
                  <Badge className={cn(REPORT_STATUS_COLORS[report.status], 'self-start shrink-0')}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {report.description}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {formatRelativeDate(report.created_at)}
                </p>

                {respondingTo === report.id ? (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Shkruani përgjigjen tuaj..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondToReport(report.id)}>
                        Dërgo
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRespondingTo(null)}>
                        Anulo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={() => setRespondingTo(report.id)}>
                      Përgjigju
                    </Button>
                    {report.status !== 'resolved' && (
                      <Button size="sm" onClick={() => markResolved(report.id)}>
                        Shëno si të Zgjidhur
                      </Button>
                    )}
                    <Link href={getReportPublicPath(report.report_number)}>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> Shiko
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Nuk ka raportime për biznesin tuaj"
            description="Raportimet që përmendin biznesin tuaj do të shfaqen këtu."
          />
        )}
      </div>
    </div>
  );
}
