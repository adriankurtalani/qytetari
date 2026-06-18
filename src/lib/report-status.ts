import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReportStatus, TimelineActorRole, UserRole } from './types';
import { notifyReportStatusChange } from './notifications';
import { recalculateCitizenTrust } from './citizen-trust';

export function roleToTimelineActor(role: UserRole | undefined): TimelineActorRole {
  if (role === 'admin') return 'admin';
  if (role === 'municipality') return 'municipality';
  if (role === 'business') return 'business';
  if (role === 'citizen') return 'citizen';
  return 'system';
}

export function getTimelineTitle(
  newStatus: ReportStatus,
  previousStatus: ReportStatus | null,
  actorRole: TimelineActorRole
): string {
  if (newStatus === 'pending_review' && !previousStatus) {
    return 'Qytetari krijoi raportimin';
  }

  switch (newStatus) {
    case 'approved':
      if (actorRole === 'municipality') return 'Komuna e pranoi rastin';
      return 'Raportimi u aprovua';
    case 'rejected':
      return 'Raportimi u refuzua';
    case 'in_progress':
      if (previousStatus === 'waiting_for_response') return 'Punët vazhdojnë pas përgjigjes';
      return 'Punët filluan';
    case 'waiting_for_response':
      return 'Në pritje të përgjigjes';
    case 'resolved':
      if (actorRole === 'business') return 'Biznesi shënoi problemin si të zgjidhur';
      return 'Problemi u zgjidh';
    default:
      return 'Statusi u përditësua';
  }
}

export async function recordTimelineEvent(
  supabase: SupabaseClient,
  params: {
    reportId: string;
    eventType: string;
    title: string;
    status?: ReportStatus | null;
    description?: string | null;
    actorId?: string | null;
    actorRole: TimelineActorRole;
    createdAt?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('report_timeline_events').insert({
    report_id: params.reportId,
    event_type: params.eventType,
    status: params.status ?? null,
    title: params.title,
    description: params.description ?? null,
    actor_id: params.actorId ?? null,
    actor_role: params.actorRole,
    ...(params.createdAt ? { created_at: params.createdAt } : {}),
  });

  if (error) {
    console.error('recordTimelineEvent:', error.message);
  }
}

export async function updateReportStatus(
  supabase: SupabaseClient,
  params: {
    reportId: string;
    newStatus: ReportStatus;
    actorId?: string | null;
    actorRole: TimelineActorRole;
    notifyUser?: boolean;
  }
): Promise<{ success: boolean; error?: string; previousStatus?: ReportStatus }> {
  const { data: existing, error: fetchError } = await supabase
    .from('reports')
    .select('status, user_id, report_number')
    .eq('id', params.reportId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: fetchError?.message || 'Raportimi nuk u gjet' };
  }

  const previousStatus = existing.status as ReportStatus;

  if (previousStatus === params.newStatus) {
    return { success: true, previousStatus };
  }

  const { error: updateError } = await supabase
    .from('reports')
    .update({ status: params.newStatus })
    .eq('id', params.reportId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase
    .from('report_stories')
    .update({ report_status: params.newStatus })
    .eq('report_id', params.reportId);

  const title = getTimelineTitle(params.newStatus, previousStatus, params.actorRole);

  await recordTimelineEvent(supabase, {
    reportId: params.reportId,
    eventType: `status_${params.newStatus}`,
    status: params.newStatus,
    title,
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  if (params.notifyUser !== false && existing.user_id) {
    await notifyReportStatusChange(
      existing.user_id,
      existing.report_number as number,
      params.newStatus
    );
  }

  const affectsTrust = (s: ReportStatus) =>
    s === 'approved' ||
    s === 'rejected' ||
    s === 'in_progress' ||
    s === 'waiting_for_response' ||
    s === 'resolved';

  if (
    existing.user_id &&
    (affectsTrust(params.newStatus) || affectsTrust(previousStatus))
  ) {
    await recalculateCitizenTrust(supabase, existing.user_id);
  }

  return { success: true, previousStatus };
}
