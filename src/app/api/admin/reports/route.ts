import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { updateReportStatus } from '@/lib/report-status';
import { recalculateCitizenTrust } from '@/lib/citizen-trust';
import { setWeeklySpotlight } from '@/lib/weekly-spotlight';
import type { ReportStatus } from '@/lib/types';

const REPORT_SELECT =
  '*, category:categories(*), photos:report_photos(*), profile:profiles(username, full_name, citizen_score, approved_reports_count, rejected_reports_count)';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get('status') || 'all';
  const serviceClient = createServiceClient();

  let query = serviceClient
    .from('reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { reportId, status, weeklySpotlight } = body as {
    reportId?: string;
    status?: ReportStatus;
    weeklySpotlight?: boolean;
  };

  if (!reportId) {
    return NextResponse.json({ error: 'ID e raportimit mungon' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  if (weeklySpotlight !== undefined) {
    const result = await setWeeklySpotlight(serviceClient, reportId, weeklySpotlight);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, weeklySpotlight });
  }

  if (!status) {
    return NextResponse.json({ error: 'Statusi mungon' }, { status: 400 });
  }

  const result = await updateReportStatus(serviceClient, {
    reportId,
    newStatus: status,
    actorId: admin.id,
    actorRole: 'admin',
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { reportId } = await request.json();
  if (!reportId) {
    return NextResponse.json({ error: 'ID e raportimit mungon' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: report, error: fetchError } = await serviceClient
    .from('reports')
    .select('user_id, photos:report_photos(storage_path)')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) {
    return NextResponse.json({ error: 'Raportimi nuk u gjet' }, { status: 404 });
  }

  const storagePaths =
    (report.photos as { storage_path: string }[] | null)
      ?.map((p) => p.storage_path)
      .filter(Boolean) || [];

  const { error: deleteError } = await serviceClient.from('reports').delete().eq('id', reportId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (storagePaths.length > 0) {
    await serviceClient.storage.from('report-photos').remove(storagePaths);
  }

  if (report.user_id) {
    await recalculateCitizenTrust(serviceClient, report.user_id);
  }

  return NextResponse.json({ success: true });
}
