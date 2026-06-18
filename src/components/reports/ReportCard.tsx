import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import { getReportPublicPath } from '@/lib/report-url';
import type { Report } from '@/lib/types';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const photo = report.photos?.[0];

  return (
    <Link href={getReportPublicPath(report.report_number)} className="group block">
      <article className="card card-hover rounded-xl sm:rounded-2xl overflow-hidden h-full flex flex-col">
        {photo ? (
          <div className="relative w-full h-36 sm:h-40 md:h-44 overflow-hidden bg-slate-100">
            <Image
              src={photo.url}
              alt={report.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              quality={85}
            />
            {report.category && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-md sm:rounded-lg bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-700 shadow-sm">
                {report.category.name}
              </span>
            )}
          </div>
        ) : (
          <div className="h-3 hero-gradient" />
        )}

        <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-1 min-w-0">
          <div className="flex flex-col gap-1.5 sm:gap-2 sm:flex-row sm:items-start sm:justify-between mb-1.5 sm:mb-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug min-w-0">
              <span className="text-blue-600 font-semibold">#{report.report_number}</span>{' '}
              {report.title}
            </h3>
            <Badge className={cn(REPORT_STATUS_COLORS[report.status], 'self-start shrink-0')}>
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-2 sm:mb-3 leading-relaxed flex-1">
            {report.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-400 mb-2 sm:mb-3">
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              {report.city}
            </span>
            <span>{formatRelativeDate(report.created_at)}</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                <span className="font-semibold text-slate-700">{report.support_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                <span className="font-semibold text-slate-700">{report.disagree_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">{report.comment_count}</span>
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              Shiko
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
