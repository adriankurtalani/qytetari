import { createServiceClient } from '@/lib/supabase/server';
import type { NotificationType } from '@/lib/types';
import { getReportPublicPath } from '@/lib/report-url';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  const supabase = createServiceClient();

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
  });
}

export async function notifyReportStatusChange(
  userId: string,
  reportNumber: number,
  status: string
) {
  const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
    approved: {
      title: 'Raportimi u Aprovua',
      message: 'Raportimi juaj është aprovuar dhe tani është publik.',
      type: 'report_approved',
    },
    rejected: {
      title: 'Raportimi u Refuzua',
      message: 'Raportimi juaj nuk u aprovua nga ekipi ynë.',
      type: 'report_rejected',
    },
    in_progress: {
      title: 'Raportimi në Proces',
      message: 'Raportimi juaj po trajtohet aktualisht.',
      type: 'status_changed',
    },
    waiting_for_response: {
      title: 'Në Pritje të Përgjigjes',
      message: 'Raportimi juaj pret përgjigje nga biznesi ose institucioni.',
      type: 'status_changed',
    },
    resolved: {
      title: 'Raportimi u Zgjidh',
      message: 'Raportimi juaj është shënuar si i zgjidhur.',
      type: 'status_changed',
    },
  };

  const notification = statusMessages[status];
  if (notification && userId) {
    await createNotification(
      userId,
      notification.type,
      notification.title,
      notification.message,
      getReportPublicPath(reportNumber)
    );
  }
}
