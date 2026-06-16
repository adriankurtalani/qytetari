import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { roleToTimelineActor, updateReportStatus } from '@/lib/report-status';
import type { ReportStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get('status') || 'pending_review';
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('reports')
    .select('*, category:categories(*), photos:report_photos(*), profile:profiles(username, full_name, citizen_score, approved_reports_count, rejected_reports_count)')
    .eq('status', status)
    .order('created_at', { ascending: false });

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

  const { reportId, status } = await request.json();
  const serviceClient = createServiceClient();

  const result = await updateReportStatus(serviceClient, {
    reportId,
    newStatus: status as ReportStatus,
    actorId: admin.id,
    actorRole: 'admin',
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
