import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Building2,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Camera,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessBySlug } from '@/lib/business-slug';
import { fetchBusinessPublicProfile } from '@/lib/business-profile';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BusinessClaimBanner } from '@/components/business/BusinessClaimBanner';
import { BusinessReputationStats } from '@/components/business/BusinessReputationStats';
import { BusinessPhotoGrid } from '@/components/business/BusinessPhotoGrid';
import { BusinessResponsesList } from '@/components/business/BusinessResponsesList';
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS } from '@/lib/business-claim';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ReportStatus, BusinessClaimStatus } from '@/lib/types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BusinessProfileProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BusinessProfileProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const business = await getBusinessBySlug(supabase, slug);

  if (!business) return { title: 'Biznesi nuk u gjet' };

  return {
    title: `${business.name} — Reputacioni`,
    description: `Shikoni reputacionin, raportimet dhe përgjigjet publike për ${business.name}${business.city ? ` në ${business.city}` : ''}.`,
  };
}

export default async function BusinessReputationPage({ params }: BusinessProfileProps) {
  const { slug } = await params;
  const supabase = await createClient();

  if (UUID_RE.test(slug)) {
    const { data: byId } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', slug)
      .maybeSingle();
    if (byId?.slug) redirect(`/businesses/${byId.slug}`);
    notFound();
  }

  const business = await getBusinessBySlug(supabase, slug);
  if (!business) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const profile = await fetchBusinessPublicProfile(supabase, business);

  const claimStatus = business.claim_status as BusinessClaimStatus;
  const canClaim = ['unclaimed', 'rejected'].includes(claimStatus);

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <Link
        href="/businesses"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Të gjitha bizneset
      </Link>

      <PageHeader
        badge="Reputacioni Publik"
        title={business.name}
        description={
          business.city
            ? `${business.city} · zeri-i-qytetarit.com/businesses/${business.slug}`
            : undefined
        }
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {business.is_verified && (
            <Badge className="bg-blue-100 text-blue-800 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> I Verifikuar
            </Badge>
          )}
          <Badge className={cn(CLAIM_STATUS_COLORS[claimStatus])}>
            {CLAIM_STATUS_LABELS[claimStatus]}
          </Badge>
        </div>
      </PageHeader>

      {business.logo_url && (
        <div className="mt-6 flex justify-center sm:justify-start">
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
          />
        </div>
      )}

      {business.description && (
        <p className="mt-4 text-slate-600 text-sm leading-relaxed max-w-2xl">{business.description}</p>
      )}

      {business.city && (
        <p className="mt-3 text-sm text-slate-500 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-blue-500" /> {business.city}
        </p>
      )}

      <div className="mt-8">
        <BusinessReputationStats metrics={profile.metrics} />
      </div>

      {canClaim && (
        <div className="mt-8">
          <BusinessClaimBanner business={business} isLoggedIn={!!user} />
        </div>
      )}

      {canClaim && user && (
        <div className="mt-4">
          <Link href={`/businesses/${business.slug}/claim`}>
            <Button size="lg" className="w-full sm:w-auto">
              Claim Business — Verifiko Pronësinë
            </Button>
          </Link>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-500" />
          Fotografi nga Raportimet
        </h2>
        <Card padding="md">
          <BusinessPhotoGrid photos={profile.photos} businessName={business.name} />
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          Përgjigjet e Biznesit
        </h2>
        <BusinessResponsesList responses={profile.responses} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          Raportimet Publike
        </h2>

        {profile.reports.length > 0 ? (
          <div className="space-y-3">
            {profile.reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card padding="md" className="card-hover">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-slate-900">{report.title}</span>
                    <Badge
                      className={cn(
                        REPORT_STATUS_COLORS[report.status as ReportStatus],
                        'self-start shrink-0'
                      )}
                    >
                      {REPORT_STATUS_LABELS[report.status as ReportStatus]}
                    </Badge>
                  </div>
                  {report.photos && report.photos.length > 0 && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {report.photos.length} foto
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Ende nuk ka raportime publike për këtë biznes.</p>
        )}
      </section>
    </div>
  );
}
