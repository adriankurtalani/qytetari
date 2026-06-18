import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin, getAdminAccess, adminDenyMessage } from '@/lib/admin-auth';
import { updateReportStatus } from '@/lib/report-status';
import type { ReportStatus } from '@/lib/types';

export async function GET() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        reason: access.reason,
        message: adminDenyMessage(access.reason, access.role),
      },
      { status: access.reason === 'unauthenticated' ? 401 : 403 }
    );
  }

  const serviceClient = createServiceClient();

  const [
    { count: totalReports },
    { count: pendingReports },
    { count: totalUsers },
    { count: totalComments },
    { data: reportsByStatus },
    { data: reportsByCity },
    { data: reportsByCategory },
  ] = await Promise.all([
    serviceClient.from('reports').select('*', { count: 'exact', head: true }),
    serviceClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    serviceClient.from('profiles').select('*', { count: 'exact', head: true }),
    serviceClient.from('comments').select('*', { count: 'exact', head: true }),
    serviceClient.from('reports').select('status'),
    serviceClient.from('reports').select('city'),
    serviceClient.from('reports').select('category_id, category:categories(name)'),
  ]);

  const statusCounts: Record<string, number> = {};
  reportsByStatus?.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const cityCounts: Record<string, number> = {};
  reportsByCity?.forEach((r) => {
    if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
  });

  const categoryCounts: Record<string, number> = {};
  reportsByCategory?.forEach((r) => {
    const category = r.category as unknown as { name: string } | null;
    const name = category?.name || 'Pa kategori';
    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
  });

  return NextResponse.json({
    totalReports: totalReports || 0,
    pendingReports: pendingReports || 0,
    totalUsers: totalUsers || 0,
    totalComments: totalComments || 0,
    statusCounts,
    cityCounts,
    categoryCounts,
  });
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
