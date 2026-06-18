import Link from 'next/link';
import Image from 'next/image';
import { Star, ThumbsUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ReportShareButtons } from '@/components/reports/ReportShareButtons';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import { getReportPublicPath, formatReportLabel } from '@/lib/report-url';
import type { Report } from '@/lib/types';

interface WeeklyReportSpotlightProps {
  report: Report;
}

export function WeeklyReportSpotlight({ report }: WeeklyReportSpotlightProps) {
  const photo = report.photos?.[0];

  return (
    <section className="page-container py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Raporti i javës</h2>
      </div>

      <div className="card rounded-2xl overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50/60 to-white">
        <div className="flex flex-col md:flex-row">
          {photo?.url && (
            <div className="relative w-full md:w-72 h-48 md:h-auto shrink-0 bg-slate-100">
              <Image
                src={photo.url}
                alt={report.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
            </div>
          )}

          <div className="flex-1 p-5 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className={cn(REPORT_STATUS_COLORS[report.status])}>
                {REPORT_STATUS_LABELS[report.status]}
              </Badge>
              {report.category && (
                <span className="text-xs font-semibold text-slate-600 bg-white rounded-lg px-2.5 py-1 border border-slate-100">
                  {report.category.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {report.support_count} mbështetje
              </span>
              {report.is_weekly_spotlight && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-lg px-2.5 py-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Zgjedhur nga admini
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
              <span className="text-amber-700">{formatReportLabel(report.report_number)}</span>
              {' · '}
              {report.title}
            </h3>
            <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
              {report.description}
            </p>
            <p className="text-xs text-slate-400 mt-3">
              {report.city} · {formatRelativeDate(report.created_at)}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5 pt-4 border-t border-amber-100/80">
              <Link href={getReportPublicPath(report.report_number)}>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Lexo historinë e plotë
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <ReportShareButtons
                title={report.title}
                reportNumber={report.report_number}
                className="sm:ml-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
