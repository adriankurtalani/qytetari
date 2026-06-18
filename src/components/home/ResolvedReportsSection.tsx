import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import { getReportPublicPath } from '@/lib/report-url';
import type { Report } from '@/lib/types';

interface ResolvedReportsSectionProps {
  reports: Report[];
}

export function ResolvedReportsSection({ reports }: ResolvedReportsSectionProps) {
  if (reports.length === 0) return null;

  return (
    <section className="bg-emerald-50/40 border-y border-emerald-100/60">
      <div className="page-container py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">U zgjidh</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Prova që raportimet sjellin ndryshim — probleme të mbyllura publikisht.
            </p>
          </div>
          <Link
            href="/?status=resolved"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Shiko të gjitha
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const photo = report.photos?.[0];
            return (
              <Link
                key={report.id}
                href={getReportPublicPath(report.report_number)}
                className="group block card rounded-2xl overflow-hidden card-hover bg-white"
              >
                {photo?.url ? (
                  <div className="relative h-36 bg-slate-100">
                    <Image
                      src={photo.url}
                      alt={report.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={cn(REPORT_STATUS_COLORS.resolved, 'shadow-sm')}>
                        {REPORT_STATUS_LABELS.resolved}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-2 bg-emerald-500" />
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors leading-snug">
                    <span className="text-emerald-700">#{report.report_number}</span> {report.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    {report.city} · {formatRelativeDate(report.updated_at)}
                  </p>
                  {report.category && (
                    <span className="inline-block mt-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-md px-2 py-0.5">
                      {report.category.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
