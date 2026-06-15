import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { moderateComment } from '@/lib/ai-moderation';
import { checkIPBan, banIP, getBannedWords } from '@/lib/ip-ban';
import { createNotification } from '@/lib/notifications';
import { getClientIP } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select('*, profile:profiles(id, username, full_name, anonymous_mode)')
    .eq('report_id', id)
    .is('parent_id', null)
    .eq('is_flagged', false)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select('*, profile:profiles(id, username, full_name, anonymous_mode)')
        .eq('parent_id', comment.id)
        .eq('is_flagged', false)
        .order('created_at', { ascending: true });

      return { ...comment, replies: replies || [] };
    })
  );

  return NextResponse.json(commentsWithReplies);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIP(request);
  const banCheck = await checkIPBan(ip);

  if (banCheck.banned) {
    return NextResponse.json({ error: 'Jeni i bllokuar' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Duhet të jeni të kyçur për të komentuar' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', user.id)
    .single();

  if (!profile?.is_verified) {
    return NextResponse.json(
      { error: 'Vetëm përdoruesit e verifikuar mund të komentojnë' },
      { status: 403 }
    );
  }

  const { content, parent_id } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Komenti nuk mund të jetë bosh' }, { status: 400 });
  }

  const bannedWords = await getBannedWords();
  const moderation = await moderateComment(content, bannedWords);

  if (!moderation.approved) {
    await banIP(ip, `Koment i flaguar: ${moderation.flags.join(', ')}`);
    return NextResponse.json(
      { error: 'Komenti juaj përmban përmbajtje të palejuar' },
      { status: 403 }
    );
  }

  const serviceClient = await createServiceClient();

  const { data: comment, error } = await serviceClient
    .from('comments')
    .insert({
      report_id: id,
      user_id: user.id,
      parent_id: parent_id || null,
      content,
    })
    .select('*, profile:profiles(id, username, full_name, anonymous_mode)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: report } = await serviceClient
    .from('reports')
    .select('user_id, title')
    .eq('id', id)
    .single();

  if (report?.user_id && report.user_id !== user.id) {
    await createNotification(
      report.user_id,
      'new_comment',
      'Koment i Ri',
      `Keni një koment të ri në raportimin "${report.title}"`,
      `/reports/${id}`
    );
  }

  return NextResponse.json(comment);
}
