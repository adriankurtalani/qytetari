import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';
import type { ReportStatus } from '@/lib/types';

const STORY_SELECT = `
  *,
  report:reports(
    *,
    category:categories(*),
    photos:report_photos(*)
  )
`;

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const reportNumber = new URL(request.url).searchParams.get('reportNumber');
  const serviceClient = createServiceClient();

  if (reportNumber) {
    const { data: report } = await serviceClient
      .from('reports')
      .select('*, category:categories(*), photos:report_photos(*)')
      .eq('report_number', Number(reportNumber))
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: 'Raportimi nuk u gjet' }, { status: 404 });
    }

    return NextResponse.json({ report });
  }

  const { data, error } = await serviceClient
    .from('report_stories')
    .select(STORY_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { reportNumber, title, content, publish } = await request.json();

  if (!reportNumber || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Fushat e domosdoshme mungojnë' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: report, error: reportError } = await serviceClient
    .from('reports')
    .select('id, status')
    .eq('report_number', Number(reportNumber))
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: 'Raportimi nuk u gjet' }, { status: 404 });
  }

  const shouldPublish = !!publish;
  const now = new Date().toISOString();

  const { data: story, error } = await serviceClient
    .from('report_stories')
    .insert({
      report_id: report.id,
      title: title.trim(),
      content: content.trim(),
      report_status: report.status as ReportStatus,
      is_published: shouldPublish,
      published_at: shouldPublish ? now : null,
      created_by: admin.id,
    })
    .select(STORY_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(story);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { storyId, title, content, publish, unpublish, refreshStatus } = await request.json();

  if (!storyId) {
    return NextResponse.json({ error: 'ID e lajmit mungon' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: existing, error: fetchError } = await serviceClient
    .from('report_stories')
    .select('*, report:reports(status)')
    .eq('id', storyId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lajmi nuk u gjet' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.content = content.trim();

  if (refreshStatus && existing.report) {
    updates.report_status = (existing.report as { status: ReportStatus }).status;
  }

  if (publish) {
    updates.is_published = true;
    updates.published_at = new Date().toISOString();
    if (existing.report) {
      updates.report_status = (existing.report as { status: ReportStatus }).status;
    }
  }

  if (unpublish) {
    updates.is_published = false;
    updates.published_at = null;
  }

  const { data: story, error } = await serviceClient
    .from('report_stories')
    .update(updates)
    .eq('id', storyId)
    .select(STORY_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(story);
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { storyId } = await request.json();
  if (!storyId) {
    return NextResponse.json({ error: 'ID e lajmit mungon' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient.from('report_stories').delete().eq('id', storyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
