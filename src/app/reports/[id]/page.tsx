import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowLeft, Building2, User, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { VoteButtons } from '@/components/reports/VoteButtons';
import { CommentSection } from '@/components/reports/CommentSection';
import { ReportPhotoGallery } from '@/components/reports/ReportPhotoGallery';
import { ReportMapWrapper } from '@/components/map/ReportMapWrapper';
import { BusinessClaimBanner } from '@/components/business/BusinessClaimBanner';
import { ReportTimeline } from '@/components/reports/ReportTimeline';
import { ReportStatusAdmin } from '@/components/reports/ReportStatusAdmin';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';
import type { ReportStatus } from '@/lib/types';
import { CitizenTrustBadge } from '@/components/profile/CitizenTrustBadge';

interface ReportDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportDetailProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      category:categories(*),
      photos:report_photos(*),
      profile:profiles(id, username, full_name, anonymous_mode, citizen_score, approved_reports_count, rejected_reports_count),
      business:businesses(id, slug, name, city, claim_status, is_verified, report_count)
    `)
    .eq('id', id)
    .single();

  if (!report) notFound();

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
    isModerator = modProfile?.role === 'admin' || modProfile?.role === 'municipality';
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight break-words min-w-0">
              {report.title}
            </h1>
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
              report.business?.slug ? (
                <Link
                  href={`/businesses/${report.business.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {report.business_name}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  <Building2 className="h-3.5 w-3.5" />
                  {report.business_name}
                </span>
              )
            )}
          </div>

          <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-6 sm:mb-8 break-words">{report.description}</p>

          {report.business && (
            <BusinessClaimBanner business={report.business} isLoggedIn={!!user} />
          )}

          {!report.business && report.business_name && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
              <p className="text-sm text-slate-600">
                Biznesi <strong>{report.business_name}</strong> do të krijohet automatikisht në sistem pas moderimit.
              </p>
              <Link href="/businesses" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                Shiko bizneset e disponueshme për verifikim →
              </Link>
            </div>
          )}

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

      <Card className="mt-6" padding="lg">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <History className="h-5 w-5 text-blue-500" />
          Kronologjia e Raportimit
        </h2>
        <ReportTimeline events={timelineWithActors} />
      </Card>

      {isModerator && (
        <div className="mt-6">
          <ReportStatusAdmin reportId={report.id} currentStatus={report.status as ReportStatus} />
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
