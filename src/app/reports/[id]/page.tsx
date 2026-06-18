import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, ArrowLeft, Building2, User, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { VoteButtons } from '@/components/reports/VoteButtons';
import { CommentSection } from '@/components/reports/CommentSection';
import { ReportPhotoGallery } from '@/components/reports/ReportPhotoGallery';
import { ReportMapWrapper } from '@/components/map/ReportMapWrapper';
import { ReportTimeline } from '@/components/reports/ReportTimeline';
import { ReportStatusAdmin } from '@/components/reports/ReportStatusAdmin';
import { ReportWeeklyPinButton } from '@/components/reports/ReportWeeklyPinButton';
import { ReportShareButtons } from '@/components/reports/ReportShareButtons';
import { RelatedReportsSection } from '@/components/reports/RelatedReportsSection';
import { getRelatedReportContext } from '@/lib/impact-stats';
import { fetchReportByRouteParam } from '@/lib/report-lookup';
import { formatReportLabel, isUuid } from '@/lib/report-url';
import { getSiteSettings } from '@/lib/site-settings';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';
import type { ReportStatus, Report } from '@/lib/types';
import { CitizenTrustBadge } from '@/components/profile/CitizenTrustBadge';

interface ReportDetailProps {
  params: Promise<{ id: string }>;
}

type ReportMetadata = Pick<Report, 'report_number' | 'title' | 'description'> & {
  photos?: { url: string }[];
};

export async function generateMetadata({ params }: ReportDetailProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getSiteSettings();

  const { data: report } = await fetchReportByRouteParam<ReportMetadata>(
    supabase,
    id,
    'report_number, title, description, photos:report_photos(url)'
  );

  if (!report) {
    return { title: 'Raporti nuk u gjet' };
  }

  const title = `${formatReportLabel(report.report_number)}: ${report.title}`;
  const description =
    report.description?.trim().slice(0, 200) ||
    `${report.title} — raportim qytetar në ${settings.site_title}`;
  const photoUrl = report.photos?.[0]?.url;
  const pagePath = `/reports/${report.report_number}`;
  const images = photoUrl ? [{ url: photoUrl, alt: report.title }] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pagePath,
      type: 'article',
      siteName: settings.site_title,
      locale: 'sq_AL',
      images,
    },
    twitter: {
      card: photoUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: photoUrl ? [photoUrl] : undefined,
    },
  };
}

export default async function ReportDetailPage({ params }: ReportDetailProps) {
  const { id } = await params;
  const supabase = await createClient();

  const reportSelect = `
      *,
      category:categories(*),
      photos:report_photos(*),
      profile:profiles(id, username, full_name, anonymous_mode, citizen_score, approved_reports_count, rejected_reports_count)
    `;

  const { data: report } = await fetchReportByRouteParam<Report>(supabase, id, reportSelect);

  if (!report) notFound();

  if (isUuid(id) && report.report_number) {
    redirect(`/reports/${report.report_number}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  let userVote = null;
  let isVerified = false;

  if (user) {
    const { data: vote } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('report_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    userVote = vote?.vote_type;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified, role')
      .eq('id', user.id)
      .single();
    isVerified = profile?.is_verified || false;
  }

  let isModerator = false;
  if (user) {
    const { data: modProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isModerator = modProfile?.role === 'admin';
  }

  const { data: timelineEvents } = await supabase
    .from('report_timeline_events')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: true });

  const timelineWithActors = await Promise.all(
    (timelineEvents || []).map(async (event) => {
      if (!event.actor_id) return { ...event, actor: null };
      const { data: actor } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', event.actor_id)
        .maybeSingle();
      return { ...event, actor };
    })
  );

  const { data: topComments } = await supabase
    .from('comments')
    .select('*, profile:profiles(id, username, full_name, anonymous_mode)')
    .eq('report_id', id)
    .is('parent_id', null)
    .eq('is_flagged', false)
    .order('created_at', { ascending: true });

  const comments = await Promise.all(
    (topComments || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select('*, profile:profiles(id, username, full_name, anonymous_mode)')
        .eq('parent_id', comment.id)
        .eq('is_flagged', false)
        .order('created_at', { ascending: true });
      return { ...comment, replies: replies || [] };
    })
  );

  const relatedContext = await getRelatedReportContext(supabase, report);

  const author = report.profile?.anonymous_mode
    ? 'Anonim'
    : report.profile?.username || 'Anonim';

  return (
    <div className="page-container py-6 sm:py-8 max-w-4xl min-w-0">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kthehu te raportimet
      </Link>

      <Card padding="none" className="overflow-hidden animate-fade-in">
        {report.photos && report.photos.length > 0 && (
          <ReportPhotoGallery photos={report.photos} title={report.title} />
        )}

        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">
                {formatReportLabel(report.report_number)}
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight break-words">
                {report.title}
              </h1>
            </div>
            <Badge className={cn(REPORT_STATUS_COLORS[report.status as ReportStatus], 'self-start shrink-0')}>
              {REPORT_STATUS_LABELS[report.status as ReportStatus]}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {report.category && (
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {report.category.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <MapPin className="h-3.5 w-3.5" />
              {report.city}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              <User className="h-3.5 w-3.5" />
              {author}
              {!report.profile?.anonymous_mode && report.profile?.citizen_score != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <CitizenTrustBadge
                    citizenScore={report.profile.citizen_score}
                    approvedCount={report.profile.approved_reports_count}
                    rejectedCount={report.profile.rejected_reports_count}
                    size="inline"
                  />
                </>
              )}
            </span>
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
              {formatDate(report.created_at)}
            </span>
            {report.business_name && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <Building2 className="h-3.5 w-3.5" />
                {report.business_name}
              </span>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-4 sm:mb-6 break-words">{report.description}</p>

          <ReportShareButtons
            title={report.title}
            reportNumber={report.report_number}
            className="mb-6"
          />

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <VoteButtons
              reportId={report.id}
              supportCount={report.support_count}
              disagreeCount={report.disagree_count}
              userVote={userVote}
              isLoggedIn={!!user}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Lokacioni i raportimit
            </h2>
            <ReportMapWrapper
              latitude={report.latitude}
              longitude={report.longitude}
              title={report.business_name || report.title}
            />
          </div>
        </div>
      </Card>

      <RelatedReportsSection report={report} context={relatedContext} />

      <Card className="mt-6" padding="lg">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <History className="h-5 w-5 text-blue-500" />
          Kronologjia e Raportimit
        </h2>
        <ReportTimeline events={timelineWithActors} />
      </Card>

      {isModerator && (
        <div className="mt-6 space-y-4">
          <ReportStatusAdmin reportId={report.id} currentStatus={report.status as ReportStatus} />
          <Card padding="md" className="border-amber-200 bg-amber-50/30">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Raporti i javës</h3>
            <p className="text-sm text-slate-600 mb-4">
              Vendos këtë raport si të theksuar në faqen kryesore, ose hiqe pinin.
            </p>
            <ReportWeeklyPinButton
              reportId={report.id}
              isPinned={!!report.is_weekly_spotlight}
            />
          </Card>
        </div>
      )}

      <Card className="mt-6" padding="lg">
        <CommentSection
          reportId={report.id}
          comments={comments}
          isVerified={isVerified}
          currentUserId={user?.id}
        />
      </Card>
    </div>
  );
}
