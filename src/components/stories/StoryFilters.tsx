'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { STORY_FILTER_OPTIONS, type StoryFilter } from '@/lib/story-status';
import { cn } from '@/lib/utils';

export function StoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get('filter') as StoryFilter) || 'all';

  function setFilter(filter: StoryFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    const qs = params.toString();
    router.push(qs ? `/lajme?${qs}` : '/lajme');
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STORY_FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setFilter(opt.value)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-[40px]',
            current === opt.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
