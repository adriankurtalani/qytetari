import type { ReportStatus, ReportStory } from './types';

export const STORY_STATUS_SUMMARIES: Record<ReportStatus, string> = {
  resolved: 'Ky problem u zgjidh dhe u dokumentua publikisht.',
  in_progress: 'Punët janë nisur — problemi ende po trajtohet.',
  waiting_for_response: 'Në pritje të përgjigjes nga institucioni ose biznesi.',
  approved: 'Raporti u verifikua por ende nuk ka zgjidhje të dokumentuar.',
  rejected: 'Raporti nuk u pranua — shihni shpjegimin e adminit më poshtë.',
  pending_review: 'Raporti është ende në rishikim nga ekipi.',
};

export type StoryFilter = 'all' | 'resolved' | 'unresolved' | 'rejected';

export const STORY_FILTER_OPTIONS: { value: StoryFilter; label: string }[] = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'resolved', label: 'Zgjidhur' },
  { value: 'unresolved', label: 'Ende pa zgjidhje' },
  { value: 'rejected', label: 'Refuzuar' },
];

const UNRESOLVED_STATUSES: ReportStatus[] = [
  'approved',
  'in_progress',
  'waiting_for_response',
  'pending_review',
];

/** Statusi aktual i raportit të lidhur (jo snapshot-i i vjetër në publikim). */
export function getStoryEffectiveStatus(
  story: Pick<ReportStory, 'report_status' | 'report'>
): ReportStatus {
  return story.report?.status ?? story.report_status;
}

export function storyMatchesFilter(
  story: Pick<ReportStory, 'report_status' | 'report'>,
  filter: StoryFilter
): boolean {
  const status = getStoryEffectiveStatus(story);
  if (filter === 'all') return true;
  if (filter === 'resolved') return status === 'resolved';
  if (filter === 'rejected') return status === 'rejected';
  return UNRESOLVED_STATUSES.includes(status);
}
