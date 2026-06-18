import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';
import { getReportPublicPath } from '@/lib/report-url';
import { updateReportStatus } from '@/lib/report-status';
import { PUBLIC_REPORT_STATUSES } from '@/lib/constants';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id);

  if (!businesses?.length) {
    return NextResponse.json({
      business: null,
      reports: [],
      responses: [],
      metrics: { totalReports: 0, resolvedReports: 0, reputationScore: 0 },
    });
  }

  const business = businesses[0];

  const { data: reports } = await supabase
    .from('reports')
    .select('*, category:categories(*), photos:report_photos(*)')
    .or(`business_id.eq.${business.id},business_name.ilike.%${business.name}%`)
    .in('status', PUBLIC_REPORT_STATUSES)
    .order('created_at', { ascending: false });

  const { data: responses } = await supabase
    .from('business_responses')
    .select('*')
    .eq('business_id', business.id);

  return NextResponse.json({
    business,
    reports: reports || [],
    responses: responses || [],
    metrics: {
      totalReports: reports?.length || 0,
      resolvedReports: reports?.filter((r) => r.status === 'resolved').length || 0,
      reputationScore: business.reputation_score,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const serviceClient = createServiceClient();

  const { data: business } = await serviceClient
    .from('businesses')
    .select('id, is_verified')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json(
      { error: 'Nuk keni një biznes të lidhur me llogarinë tuaj' },
      { status: 403 }
    );
  }

  if (body.action === 'respond') {
    const { data, error } = await serviceClient
      .from('business_responses')
      .insert({
        business_id: business.id,
        report_id: body.report_id,
        content: body.content,
        resolution_evidence_url: body.evidence_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: report } = await serviceClient
      .from('reports')
      .select('user_id, title, report_number')
      .eq('id', body.report_id)
      .single();

    if (report?.user_id) {
      await createNotification(
        report.user_id,
        'business_response',
        'Përgjigje nga Biznesi',
        `Biznesi u përgjigj në raportimin "${report.title}"`,
        getReportPublicPath(report.report_number)
      );
    }

    return NextResponse.json(data);
  }

  if (body.action === 'resolve') {
    const result = await updateReportStatus(serviceClient, {
      reportId: body.report_id,
      newStatus: 'resolved',
      actorId: user.id,
      actorRole: 'business',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Veprim i panjohur' }, { status: 400 });
}
