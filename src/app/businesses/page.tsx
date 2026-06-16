'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Search, MapPin, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { KOSOVO_CITIES } from '@/lib/constants';
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS } from '@/lib/business-claim';
import { cn } from '@/lib/utils';
import type { Business } from '@/lib/types';

type BusinessListItem = Pick<
  Business,
  | 'id'
  | 'slug'
  | 'name'
  | 'city'
  | 'claim_status'
  | 'is_verified'
  | 'report_count'
  | 'reputation_score'
  | 'created_at'
>;

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, [city]);

  async function loadBusinesses(search?: string) {
    setLoading(true);
    const params = new URLSearchParams({ status: 'unclaimed' });
    if (city) params.set('city', city);
    if (search?.trim()) params.set('q', search.trim());

    const res = await fetch(`/api/businesses?${params}`);
    if (res.ok) setBusinesses(await res.json());
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBusinesses(q);
  }

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Bizneset"
        title="Biznese pa Pronar"
        description="Këto biznese u krijuan automatikisht nga raportimet e qytetarëve. Verifikoni pronësinë tuaj."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
      </PageHeader>

      <Card className="mt-8" padding="md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Kërko biznesin..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Të gjitha qytetet' },
              ...KOSOVO_CITIES.map((c) => ({ value: c, label: c })),
            ]}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="sm:w-48"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Kërko
          </button>
        </form>
      </Card>

      <div className="mt-8">
        {loading ? (
          <LoadingSpinner />
        ) : businesses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <Link key={b.id} href={`/businesses/${b.slug}`}>
                <Card padding="md" className="card-hover h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-slate-900 leading-snug">{b.name}</h3>
                    <Badge className={cn(CLAIM_STATUS_COLORS[b.claim_status], 'shrink-0 text-xs')}>
                      {CLAIM_STATUS_LABELS[b.claim_status]}
                    </Badge>
                  </div>
                  {b.city && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-3">
                      <MapPin className="h-3.5 w-3.5" /> {b.city}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mb-4">
                    {b.report_count} raportim{b.report_count !== 1 ? 'e' : ''}
                    {b.is_verified && b.reputation_score > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        · Reputacioni {Math.round(b.reputation_score)}/100
                      </span>
                    )}
                  </p>
                  <span className="text-sm font-medium text-blue-600 inline-flex items-center gap-1">
                    Shiko & Claim <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Nuk u gjetën biznese"
            description="Provoni një kërkim tjetër ose prisni që qytetarët të raportojnë biznese të reja."
          />
        )}
      </div>
    </div>
  );
}
