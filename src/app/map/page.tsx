import { createClient } from '@/lib/supabase/server';
import { MapPageClient } from '@/components/map/MapPageClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';

export default async function MapPage() {
  const supabase = await createClient();

  const [{ data: reports }, { data: categories }] = await Promise.all([
    supabase
      .from('reports')
      .select('*, category:categories(*)')
      .in('status', ['approved', 'in_progress', 'resolved']),
    supabase.from('categories').select('*').eq('is_active', true),
  ]);

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        badge="Harta interaktive"
        title="Harta e Raportimeve"
        description="Shikoni të gjitha raportimet në hartë. Filtroni sipas kategorisë dhe klikoni për detaje."
      />

      <Card padding="none" className="mt-4 sm:mt-6 overflow-hidden h-[min(72dvh,640px)] min-h-[280px] sm:min-h-[400px]">
        <MapPageClient reports={reports || []} categories={categories || []} />
      </Card>
    </div>
  );
}
