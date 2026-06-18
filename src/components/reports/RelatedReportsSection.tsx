import Link from 'next/link';
import { Users, MapPin, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { getReportPublicPath } from '@/lib/report-url';
import { cn } from '@/lib/utils';
import type { RelatedReportContext } from '@/lib/impact-stats';
import type { Report } from '@/lib/types';

interface RelatedReportsSectionProps {
  report: Report;
  context: RelatedReportContext;
}

export function RelatedReportsSection({ report, context }: RelatedReportsSectionProps) {
  const { nearbyCount, categoryCount, relatedReports } = context;

  if (categoryCount === 0 && relatedReports.length === 0) return null;

  let headline = '';
  if (nearbyCount > 0) {
    headline = `${nearbyCount + 1} raporte për të njëjtën zonë`;
  } else if (categoryCount > 0) {
    headline = `${categoryCount + 1} raporte për kategorinë "${report.category?.name}" në ${report.city}`;
  } else {
    headline = 'Raporte të ngjashme';
  }

  return (
    <Card className="mt-6" padding="lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">{headline}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Nuk është vetëm një ankesë individuale — qytetarë të tjerë kanë raportuar probleme të ngjashme.
          </p>
        </div>
      </div>

      {relatedReports.length > 0 && (
        <div className="space-y-3">
          {relatedReports.map((peer) => (
            <Link
              key={peer.id}
              href={getReportPublicPath(peer.report_number)}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 line-clamp-1 group-hover:text-blue-700">
                  <span className="text-blue-600 font-semibold">#{peer.report_number}</span> {peer.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <Badge className={cn(REPORT_STATUS_COLORS[peer.status], 'text-[10px] px-1.5 py-0')}>
                    {REPORT_STATUS_LABELS[peer.status]}
                  </Badge>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {peer.city}
                  </span>
                  <span>{peer.support_count} mbështetje</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
