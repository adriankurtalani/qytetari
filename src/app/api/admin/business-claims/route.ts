import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { data: claims, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('claim_status', 'pending_claim')
    .order('claim_submitted_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const claimList = claims || [];
  const claimantIds = claimList
    .map((c) => c.claim_submitted_by)
    .filter((id): id is string => !!id);

  let profileMap: Record<string, { id: string; full_name: string | null; username: string | null; email: string | null }> = {};

  if (claimantIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, email')
      .in('id', claimantIds);

    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  const enriched = await Promise.all(
    claimList.map(async (claim) => {
      let certificate_signed_url: string | null = null;
      if (claim.certificate_url) {
        const { data: signed } = await supabase.storage
          .from('business-documents')
          .createSignedUrl(claim.certificate_url, 3600);
        certificate_signed_url = signed?.signedUrl ?? null;
      }
      return {
        ...claim,
        claimant: claim.claim_submitted_by
          ? profileMap[claim.claim_submitted_by] ?? null
          : null,
        certificate_signed_url,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { businessId, action, rejection_reason } = body;

  if (!businessId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Parametra të pavlefshëm' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .eq('claim_status', 'pending_claim')
    .single();

  if (!business || !business.claim_submitted_by) {
    return NextResponse.json({ error: 'Kërkesa nuk u gjet' }, { status: 404 });
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('businesses')
      .update({
        claim_status: 'verified',
        owner_id: business.claim_submitted_by,
        is_verified: true,
        claim_rejection_reason: null,
      })
      .eq('id', businessId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: claimantProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', business.claim_submitted_by)
      .single();

    // Keep admin/municipality roles — only citizens become business owners
    const profileUpdate: { is_verified: boolean; role?: string } = { is_verified: true };
    if (claimantProfile?.role === 'citizen') {
      profileUpdate.role = 'business';
    }

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', business.claim_submitted_by);

    await createNotification(
      business.claim_submitted_by,
      'business_claim_approved',
      'Biznesi u Verifikua',
      `Kërkesa juaj për "${business.name}" u aprovua. Tani mund të menaxhoni raportimet.`,
      '/business'
    );

    return NextResponse.json({ success: true, status: 'verified' });
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      claim_status: 'rejected',
      claim_rejection_reason: rejection_reason || 'Dokumentacioni nuk u verifikua',
      official_email: null,
      fiscal_number: null,
      certificate_url: null,
      claim_submitted_at: null,
      claim_submitted_by: null,
    })
    .eq('id', businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createNotification(
    business.claim_submitted_by,
    'business_claim_rejected',
    'Kërkesa u Refuzua',
    `Kërkesa për "${business.name}" u refuzua. ${rejection_reason || ''}`.trim(),
    `/businesses/${business.slug}/claim`
  );

  return NextResponse.json({ success: true, status: 'rejected' });
}
