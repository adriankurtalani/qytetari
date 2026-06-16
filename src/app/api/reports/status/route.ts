import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyModerator } from '@/lib/admin-auth';
import { roleToTimelineActor, updateReportStatus } from '@/lib/report-status';
import type { ReportStatus } from '@/lib/types';

const VALID_STATUSES: ReportStatus[] = [
  'pending_review',
  'approved',
  'rejected',
  'in_progress',
  'waiting_for_response',
  'resolved',
];

export async function PATCH(request: NextRequest) {
  const moderator = await verifyModerator();
  if (!moderator) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { reportId, status } = await request.json();

  if (!reportId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Parametra të pavlefshëm' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const result = await updateReportStatus(serviceClient, {
    reportId,
    newStatus: status,
    actorId: moderator.user.id,
    actorRole: roleToTimelineActor(moderator.role),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, previousStatus: result.previousStatus });
}
