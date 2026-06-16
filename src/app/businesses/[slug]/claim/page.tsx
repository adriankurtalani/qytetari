import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessBySlug } from '@/lib/business-slug';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { BusinessClaimForm } from '@/components/business/BusinessClaimForm';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ClaimPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  if (UUID_RE.test(slug)) {
    const { data: byId } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', slug)
      .maybeSingle();
    if (byId?.slug) redirect(`/businesses/${byId.slug}/claim`);
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/login?redirect=/businesses/${slug}/claim`);
  }

  const business = await getBusinessBySlug(supabase, slug);
  if (!business) notFound();

  if (!['unclaimed', 'rejected'].includes(business.claim_status)) {
    redirect(`/businesses/${slug}`);
  }

  return (
    <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
      <Link
        href={`/businesses/${slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kthehu te biznesi
      </Link>

      <PageHeader
        badge="Verifikim"
        title="Claim Business"
        description={`Verifikoni pronësinë e "${business.name}" duke dorëzuar dokumentacionin zyrtar.`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
      </PageHeader>

      <Card className="mt-8" padding="md">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-6 text-sm text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800 mb-2">Çfarë ju nevojitet:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Certifikata e regjistrimit të biznesit (PDF ose foto)</li>
            <li>Email zyrtar i biznesit</li>
            <li>Numri fiskal (NUI)</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Pas dorëzimit, ekipi ynë do ta shqyrtojë kërkesën. Pas aprovimit, biznesi juaj shënohet si{' '}
            <strong>I Verifikuar</strong> dhe mund të përgjigjeni ndaj raportimeve.
          </p>
        </div>

        {business.claim_status === 'rejected' && business.claim_rejection_reason && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6 text-sm text-red-800">
            Kërkesa e mëparshme u refuzua: {business.claim_rejection_reason}
          </div>
        )}

        <BusinessClaimForm business={business} />
      </Card>
    </div>
  );
}
