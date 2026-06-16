'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Mail,
  Hash,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeDate } from '@/lib/utils';
import type { Business, Profile } from '@/lib/types';

interface PendingClaim extends Business {
  claimant: Pick<Profile, 'id' | 'full_name' | 'username' | 'email'> | null;
  certificate_signed_url: string | null;
}

export default function AdminBusinessClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    const res = await fetch('/api/admin/business-claims');
    if (res.status === 403) {
      router.push('/');
      return;
    }
    if (res.ok) setClaims(await res.json());
    setLoading(false);
  }

  async function handleAction(businessId: string, action: 'approve' | 'reject') {
    let rejection_reason: string | undefined;
    if (action === 'reject') {
      rejection_reason = prompt('Arsyeja e refuzimit (opsionale):') || undefined;
    }

    setProcessing(businessId);
    await fetch('/api/admin/business-claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, action, rejection_reason }),
    });
    setClaims((prev) => prev.filter((c) => c.id !== businessId));
    setProcessing(null);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Administrim"
        title="Kërkesat e Verifikimit të Bizneseve"
        description="Shqyrtoni dokumentacionin dhe aprovoni ose refuzoni kërkesat e pronësisë."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
      </PageHeader>

      <Link href="/admin" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
        ← Kthehu te paneli kryesor
      </Link>

      <div className="mt-8 space-y-6">
        {claims.length > 0 ? (
          claims.map((claim) => (
            <Card key={claim.id} padding="md">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{claim.name}</h3>
                    <Badge className="bg-amber-100 text-amber-800">Në Pritje</Badge>
                  </div>
                  {claim.city && <p className="text-sm text-slate-500">{claim.city}</p>}
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {claim.claim_submitted_at
                      ? formatRelativeDate(claim.claim_submitted_at)
                      : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(claim.id, 'approve')}
                    disabled={processing === claim.id}
                    className="gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" /> Aprovo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(claim.id, 'reject')}
                    disabled={processing === claim.id}
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" /> Refuzo
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Kërkuesi</p>
                      <p className="font-medium text-slate-900">
                        {claim.claimant?.full_name || claim.claimant?.username || '—'}
                      </p>
                      <p className="text-slate-500">{claim.claimant?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Email zyrtar i biznesit</p>
                      <p className="font-medium text-slate-900">{claim.official_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Numri fiskal</p>
                      <p className="font-medium text-slate-900 font-mono">{claim.fiscal_number}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">Certifikata e biznesit</p>
                  {claim.certificate_signed_url ? (
                    <a
                      href={claim.certificate_signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Shiko certifikatën
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">Certifikata nuk është e disponueshme</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={Building2}
            title="Nuk ka kërkesa në pritje"
            description="Kërkesat e reja për verifikim të bizneseve do të shfaqen këtu."
          />
        )}
      </div>
    </div>
  );
}
