'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StoryLikeButton } from '@/components/stories/StoryLikeButton';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { STORY_STATUS_SUMMARIES, getStoryEffectiveStatus } from '@/lib/story-status';
import { getReportPublicPath, formatReportLabel } from '@/lib/report-url';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { ReportStory } from '@/lib/types';

interface StoryCardProps {
  story: ReportStory;
  isLoggedIn: boolean;
}

export function StoryCard({ story, isLoggedIn }: StoryCardProps) {
  const photo = story.report?.photos?.[0];
  const status = getStoryEffectiveStatus(story);
  const isResolved = status === 'resolved';

  return (
    <Card
      padding="none"
      className={cn(
        'overflow-hidden',
        isResolved ? 'border-emerald-100' : 'border-slate-200'
      )}
    >
      <div className="flex flex-col md:flex-row">
        {photo?.url && (
          <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0 bg-slate-100">
            <Image
              src={photo.url}
              alt={story.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 224px"
            />
          </div>
        )}

        <div className="flex-1 p-5 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={cn(REPORT_STATUS_COLORS[status])}>
              {REPORT_STATUS_LABELS[status]}
            </Badge>
            {story.report && (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
                {formatReportLabel(story.report.report_number)}
              </span>
            )}
            {story.report?.category && (
              <span className="text-xs font-medium text-slate-500">
                {story.report.category.name}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
            {story.title}
          </h2>

          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {STORY_STATUS_SUMMARIES[status]}
          </p>

          <p className="text-sm sm:text-base text-slate-700 mt-4 leading-relaxed whitespace-pre-wrap">
            {story.content}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            {story.report && (
              <Link
                href={getReportPublicPath(story.report.report_number)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Shiko raportin
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <span className="text-xs text-slate-400">
              {story.published_at ? formatRelativeDate(story.published_at) : ''}
            </span>
            <div className="w-full sm:w-auto sm:ml-auto">
              <StoryLikeButton
                storyId={story.id}
                initialCount={story.like_count}
                initialLiked={!!story.user_liked}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
