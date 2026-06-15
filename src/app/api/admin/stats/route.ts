import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notifyReportStatusChange } from '@/lib/notifications';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();

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
  const serviceClient = await createServiceClient();

  const { data: report, error } = await serviceClient
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select('user_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (report?.user_id) {
    await notifyReportStatusChange(report.user_id, reportId, status);
  }

  return NextResponse.json({ success: true });
}
