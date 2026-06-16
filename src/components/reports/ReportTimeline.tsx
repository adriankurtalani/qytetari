'use client';

import { cn, formatTimelineDate } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  User,
  Building2,
  Landmark,
  Shield,
} from 'lucide-react';
import type { ReportTimelineEvent, TimelineActorRole } from '@/lib/types';

const ACTOR_ICONS: Record<TimelineActorRole, typeof User> = {
  citizen: User,
  admin: Shield,
  municipality: Landmark,
  business: Building2,
  system: Circle,
};

const ACTOR_LABELS: Record<TimelineActorRole, string> = {
  citizen: 'Qytetari',
  admin: 'Administrata',
  municipality: 'Komuna',
  business: 'Biznesi',
  system: 'Sistemi',
};

interface ReportTimelineProps {
  events: ReportTimelineEvent[];
}

export function ReportTimeline({ events }: ReportTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">Ende nuk ka ngjarje në kronologjinë e raportimit.</p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const Icon = ACTOR_ICONS[event.actor_role] || Clock;
        const isLast = index === events.length - 1;
        const isResolved = event.status === 'resolved';
        const isRejected = event.status === 'rejected';

        return (
          <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200"
                aria-hidden
              />
            )}

            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                isResolved && 'border-emerald-500 bg-emerald-50 text-emerald-600',
                isRejected && 'border-red-400 bg-red-50 text-red-500',
                !isResolved && !isRejected && 'border-blue-500 bg-blue-50 text-blue-600'
              )}
            >
              {isResolved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : event.event_type === 'created' ? (
                <User className="h-4 w-4" />
              ) : event.status === 'waiting_for_response' ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{event.title}</p>
                <time
                  dateTime={event.created_at}
                  className="text-xs font-medium text-slate-400 shrink-0 tabular-nums"
                >
                  {formatTimelineDate(event.created_at)}
                </time>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ACTOR_LABELS[event.actor_role]}
                {event.actor?.full_name || event.actor?.username
                  ? ` · ${event.actor.full_name || event.actor.username}`
                  : ''}
              </p>
              {event.description && (
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{event.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
