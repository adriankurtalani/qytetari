import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getBusinessBySlug } from '@/lib/business-slug';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Duhet të jeni të kyçur' }, { status: 401 });
  }

  const body = await request.json();
  const { official_email, fiscal_number, certificate_url } = body;

  if (!official_email || !fiscal_number || !certificate_url) {
    return NextResponse.json(
      { error: 'Certifikata, emaili zyrtar dhe numri fiskal janë të domosdoshëm' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(official_email)) {
    return NextResponse.json({ error: 'Email zyrtar i pavlefshëm' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: userProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role === 'admin' || userProfile?.role === 'municipality') {
    return NextResponse.json(
      {
        error:
          'Llogaritë admin/komunë nuk mund të verifikojnë biznese. Përdorni një llogari qytetari për testim.',
      },
      { status: 403 }
    );
  }

  const business = await getBusinessBySlug(serviceClient, slug);

  if (!business) {
    return NextResponse.json({ error: 'Biznesi nuk u gjet' }, { status: 404 });
  }

  if (!['unclaimed', 'rejected'].includes(business.claim_status)) {
    return NextResponse.json(
      { error: 'Ky biznes nuk mund të kërkohet — tashmë ka pronar ose kërkesë në pritje' },
      { status: 409 }
    );
  }

  const { data: existingOwned } = await serviceClient
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .eq('claim_status', 'verified')
    .maybeSingle();

  if (existingOwned) {
    return NextResponse.json(
      { error: 'Ju keni tashmë një biznes të verifikuar' },
      { status: 409 }
    );
  }

  const { data: pendingClaim } = await serviceClient
    .from('businesses')
    .select('id')
    .eq('claim_submitted_by', user.id)
    .eq('claim_status', 'pending_claim')
    .maybeSingle();

  if (pendingClaim) {
    return NextResponse.json(
      { error: 'Ju keni tashmë një kërkesë verifikimi në pritje' },
      { status: 409 }
    );
  }

  const { data: updated, error } = await serviceClient
    .from('businesses')
    .update({
      claim_status: 'pending_claim',
      official_email: official_email.trim(),
      fiscal_number: fiscal_number.trim(),
      certificate_url,
      claim_submitted_at: new Date().toISOString(),
      claim_submitted_by: user.id,
      claim_rejection_reason: null,
    })
    .eq('id', business.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
