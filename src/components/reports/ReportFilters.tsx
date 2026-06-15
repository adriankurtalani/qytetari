'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { KOSOVO_CITIES, REPORT_STATUS_LABELS } from '@/lib/constants';
import type { Category, FeedSort } from '@/lib/types';

interface ReportFiltersProps {
  categories: Category[];
}

export function ReportFilters({ categories }: ReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/');
  }

  const hasFilters =
    searchParams.get('city') ||
    searchParams.get('category') ||
    searchParams.get('status') ||
    (searchParams.get('sort') && searchParams.get('sort') !== 'latest');

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 min-w-0">
          <SlidersHorizontal className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="truncate">Filtro raportimet</span>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500">
            <X className="h-3.5 w-3.5" />
            Pastro
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Renditja"
          options={[
            { value: 'latest', label: 'Më të Fundit' },
            { value: 'most_supported', label: 'Më të Mbështeturat' },
            { value: 'trending', label: 'Trending' },
          ]}
          value={searchParams.get('sort') || 'latest'}
          onChange={(e) => updateFilter('sort', e.target.value as FeedSort)}
        />
        <Select
          label="Qyteti"
          options={[
            { value: '', label: 'Të gjitha qytetet' },
            ...KOSOVO_CITIES.map((c) => ({ value: c, label: c })),
          ]}
          value={searchParams.get('city') || ''}
          onChange={(e) => updateFilter('city', e.target.value)}
        />
        <Select
          label="Kategoria"
          options={[
            { value: '', label: 'Të gjitha kategoritë' },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
          value={searchParams.get('category') || ''}
          onChange={(e) => updateFilter('category', e.target.value)}
        />
        <Select
          label="Statusi"
          options={[
            { value: '', label: 'Të gjitha statuset' },
            ...Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
          value={searchParams.get('status') || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
        />
      </div>
    </div>
  );
}
