import Link from 'next/link';
import { Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS } from '@/lib/business-claim';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Business } from '@/lib/types';

interface BusinessClaimBannerProps {
  business: Pick<
    Business,
    'slug' | 'name' | 'city' | 'claim_status' | 'is_verified' | 'report_count'
  >;
  isLoggedIn: boolean;
}

export function BusinessClaimBanner({ business, isLoggedIn }: BusinessClaimBannerProps) {
  if (business.claim_status === 'verified') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">{business.name}</p>
            <p className="text-sm text-blue-700 mt-1">Biznes i verifikuar në platformë.</p>
            <Link href={`/businesses/${business.slug}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Shiko profilin e biznesit →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (business.claim_status === 'pending_claim') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 mb-6">
        <p className="font-semibold text-amber-900">{business.name}</p>
        <p className="text-sm text-amber-700 mt-1">
          Ky biznes ka një kërkesë verifikimi në pritje të aprovimit nga administrata.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 shrink-0">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-indigo-900">{business.name}</p>
              <Badge className={cn(CLAIM_STATUS_COLORS[business.claim_status], 'text-xs')}>
                {CLAIM_STATUS_LABELS[business.claim_status]}
              </Badge>
            </div>
            <p className="text-sm text-indigo-700 mt-1 leading-relaxed">
              {business.report_count > 1
                ? `${business.report_count} raportime lidhen me këtë biznes. `
                : 'Ky biznes u krijua automatikisht nga raportimi. '}
              Jeni pronari? Verifikoni biznesin tuaj për të përgjigjur ndaj raportimeve.
            </p>
          </div>
        </div>

        {isLoggedIn ? (
          <Link href={`/businesses/${business.slug}/claim`} className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              Claim Business <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/auth/login?redirect=/businesses/${business.slug}/claim`} className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              Kyçu për të Verifikuar <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
