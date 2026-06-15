'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Report, Category } from '@/lib/types';

const ReportsMap = dynamic(
  () => import('@/components/map/ReportsMap').then((m) => m.ReportsMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl" /> }
);

interface MapPageClientProps {
  reports: Report[];
  categories: Category[];
}

export function MapPageClient({ reports, categories }: MapPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div className="h-full w-full min-h-0">
      <ReportsMap
        reports={reports}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
    </div>
  );
}
