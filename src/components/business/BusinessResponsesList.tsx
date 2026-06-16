import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeDate, cn } from '@/lib/utils';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import type { BusinessResponseWithReport } from '@/lib/business-reputation';
import type { ReportStatus } from '@/lib/types';

interface BusinessResponsesListProps {
  responses: BusinessResponseWithReport[];
}

export function BusinessResponsesList({ responses }: BusinessResponsesListProps) {
  if (responses.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        Biznesi ende nuk ka përgjigjur publikisht ndaj raportimeve.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.id} padding="md" className="border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            {response.report ? (
              <Link
                href={`/reports/${response.report.id}`}
                className="font-semibold text-slate-900 hover:text-blue-600 text-sm leading-snug"
              >
                {response.report.title}
              </Link>
            ) : (
              <span className="text-sm font-medium text-slate-600">Përgjigje ndaj raportimit</span>
            )}
            {response.report && (
              <Badge
                className={cn(
                  REPORT_STATUS_COLORS[response.report.status as ReportStatus],
                  'self-start shrink-0 text-xs'
                )}
              >
                {REPORT_STATUS_LABELS[response.report.status as ReportStatus]}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {response.content}
          </p>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {formatRelativeDate(response.created_at)}
          </p>
        </Card>
      ))}
    </div>
  );
}
