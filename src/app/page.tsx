import { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle, Map, TrendingUp, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ReportCard } from '@/components/reports/ReportCard';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Button } from '@/components/ui/Button';
import { getSiteSettings, getHeroTitle, getHeroDescription } from '@/lib/site-settings';
import type { FeedSort } from '@/lib/types';

interface HomeProps {
  searchParams: Promise<{
    city?: string;
    category?: string;
    status?: string;
    sort?: FeedSort;
  }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  let query = supabase
    .from('reports')
    .select('*, category:categories(*), photos:report_photos(*)')
    .in('status', ['approved', 'in_progress', 'resolved']);

  if (params.city) query = query.eq('city', params.city);
  if (params.status) query = query.eq('status', params.status);
  if (params.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const sort = params.sort || 'latest';
  if (sort === 'most_supported') {
    query = query.order('support_count', { ascending: false });
  } else if (sort === 'trending') {
    query = query.order('support_count', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: reports } = await query.limit(30);
  const settings = await getSiteSettings();

  return (
    <>
      {/* Hero */}
      <section className="hero-gradient text-white">
        <div className="page-container py-8 sm:py-12 md:py-16">
          <div className="max-w-2xl animate-fade-in min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] sm:text-xs font-medium backdrop-blur-sm mb-4">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              {settings.hero_badge}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight break-words">
              {getHeroTitle(settings)}
            </h1>
            <p className="mt-3 sm:mt-4 text-blue-100 text-sm sm:text-base md:text-lg leading-relaxed">
              {getHeroDescription(settings)}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/reports/new" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto min-h-[44px]">
                  <PlusCircle className="h-5 w-5" />
                  {settings.hero_cta_primary}
                </Button>
              </Link>
              <Link href="/map" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-2 w-full sm:w-auto min-h-[44px] text-white border border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
                >
                  <Map className="h-5 w-5" />
                  {settings.hero_cta_secondary}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
            {[
              { icon: TrendingUp, label: 'Transparencë' },
              { icon: Map, label: 'Lokacion i saktë' },
              { icon: Shield, label: 'Moderim i sigurt' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 sm:gap-2 rounded-xl bg-white/10 px-2 sm:px-3 py-3 sm:py-4 backdrop-blur-sm text-center min-w-0"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-blue-100 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feed */}
      <div className="page-container py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Raportimet e fundit</h2>
            <p className="text-sm text-slate-500 mt-1">
              {reports?.length || 0} raportime publike
              {params.city ? ` në ${params.city}` : ''}
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse mb-6" />
          }
        >
          <ReportFilters categories={categories || []} />
        </Suspense>

        {reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {reports.map((report, i) => (
              <div key={report.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <ReportCard report={report} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center py-16 card rounded-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
              <MegaphoneEmpty />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Nuk ka raportime ende</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
              Bëhu i pari që raporton një problem në komunitetin tuaj.
            </p>
            <Link href="/reports/new" className="mt-6 inline-block">
              <Button size="lg" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Raporto tani
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function MegaphoneEmpty() {
  return (
    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}
