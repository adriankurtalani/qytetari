import { createClient } from '@/lib/supabase/server';
import { ReportForm } from '@/components/reports/ReportForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Camera, MapPin, FileText } from 'lucide-react';

export default async function NewReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  let isAnonymous = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('anonymous_mode')
      .eq('id', user.id)
      .single();
    isAnonymous = profile?.anonymous_mode || false;
  }

  const steps = [
    { icon: FileText, label: 'Përshkruani problemin' },
    { icon: Camera, label: 'Ngarkoni foto' },
    { icon: MapPin, label: 'Vendosni lokacionin' },
  ];

  return (
    <div className="page-container-narrow py-6 sm:py-10">
      <PageHeader
        badge="Raportim i ri"
        title="Raporto një Problem"
        description="Dokumentoni problemin me foto dhe lokacion të saktë. Ekipi ynë do ta rishikojë brenda 10–20 minutave."
      />

      <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-0.5 px-0.5 scrollbar-thin">
        {steps.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className="flex items-center gap-2 shrink-0 rounded-xl bg-blue-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-blue-700 max-w-[85vw] sm:max-w-none"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
              {i + 1}
            </span>
            <Icon className="h-4 w-4" />
            {label}
          </div>
        ))}
      </div>

      <Card className="mt-8" padding="lg">
        <ReportForm
          categories={categories || []}
          isLoggedIn={!!user}
          isAnonymous={isAnonymous}
        />
      </Card>
    </div>
  );
}
