import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Report } from '@/lib/types';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const photo = report.photos?.[0];

  return (
    <Link href={`/reports/${report.id}`} className="group block">
      <article className="card card-hover rounded-2xl overflow-hidden h-full flex flex-col">
        {photo ? (
          <div className="relative h-44 sm:h-52 w-full bg-slate-100 overflow-hidden">
            <Image
              src={photo.url}
              alt={report.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {report.category && (
              <span className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {report.category.name}
              </span>
            )}
          </div>
        ) : (
          <div className="h-3 hero-gradient" />
        )}

        <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
            <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug min-w-0">
              {report.title}
            </h3>
            <Badge className={cn(REPORT_STATUS_COLORS[report.status], 'self-start shrink-0')}>
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
            {report.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              {report.city}
            </span>
            <span>{formatRelativeDate(report.created_at)}</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-700">{report.support_count}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsDown className="h-4 w-4 text-red-400" />
                <span className="font-semibold text-slate-700">{report.disagree_count}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-slate-400" />
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
