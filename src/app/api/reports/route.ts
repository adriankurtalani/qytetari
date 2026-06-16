import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { moderateContent } from '@/lib/ai-moderation';
import { checkIPBan, banIP, getBannedWords } from '@/lib/ip-ban';
import { findOrCreateUnclaimedBusiness } from '@/lib/business-claim';
import { recordTimelineEvent } from '@/lib/report-status';
import { getClientIP } from '@/lib/utils';
import { MAX_PHOTOS_PER_REPORT, PUBLIC_REPORT_STATUSES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const banCheck = await checkIPBan(ip);

  if (banCheck.banned) {
    return NextResponse.json(
      { error: `Jeni i bllokuar: ${banCheck.reason}` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    title,
    description,
    category_id,
    business_name,
    city,
    latitude,
    longitude,
    photo_urls,
    anonymous_id,
  } = body;

  if (!title || !description || !category_id || !city || !latitude || !longitude) {
    return NextResponse.json({ error: 'Fushat e domosdoshme mungojnë' }, { status: 400 });
  }

  if (!photo_urls || photo_urls.length === 0) {
    return NextResponse.json({ error: 'Fotografia është e domosdoshme' }, { status: 400 });
  }

  if (photo_urls.length > MAX_PHOTOS_PER_REPORT) {
    return NextResponse.json(
      { error: `Maksimumi ${MAX_PHOTOS_PER_REPORT} foto për raportim` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const bannedWords = await getBannedWords();
  const aiResult = await moderateContent(title, description, bannedWords);

  if (!aiResult.approved || aiResult.flags.length > 0) {
    await banIP(ip, `Moderim AI: ${aiResult.flags.join(', ')}`);
    return NextResponse.json(
      { error: 'Raportimi juaj u flagua për shkak të përmbajtjes së palejuar.' },
      { status: 403 }
    );
  }

  const serviceClient = await createServiceClient();

  const reportData: Record<string, unknown> = {
    title,
    description,
    category_id,
    business_name: business_name || null,
    city,
    latitude,
    longitude,
    status: 'pending_review',
    ai_recommendation: aiResult,
    ai_flagged: !aiResult.approved,
  };

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('anonymous_mode')
      .eq('id', user.id)
      .single();

    if (!profile?.anonymous_mode) {
      reportData.user_id = user.id;
    } else {
      reportData.anonymous_id = anonymous_id || `anon_${user.id}`;
    }
  } else {
    reportData.anonymous_id = anonymous_id;
  }

  const { data: report, error } = await serviceClient
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const photoRecords = photo_urls.map((url: string) => ({
    report_id: report.id,
    storage_path: url.split('/').pop() || '',
    url,
  }));

  await serviceClient.from('report_photos').insert(photoRecords);

  await recordTimelineEvent(serviceClient, {
    reportId: report.id,
    eventType: 'created',
    status: 'pending_review',
    title: 'Qytetari krijoi raportimin',
    actorId: user?.id ?? null,
    actorRole: user ? 'citizen' : 'system',
    createdAt: report.created_at,
  });

  if (business_name?.trim()) {
    const business = await findOrCreateUnclaimedBusiness(
      serviceClient,
      business_name.trim(),
      city
    );
    if (business) {
      await serviceClient
        .from('reports')
        .update({ business_id: business.id })
        .eq('id', report.id);
    }
  }

  return NextResponse.json({ id: report.id, status: 'pending_review' });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'latest';

  const supabase = await createClient();

  let query = supabase
    .from('reports')
    .select('*, category:categories(*), photos:report_photos(*)')
    .in('status', PUBLIC_REPORT_STATUSES);

  if (city) query = query.eq('city', city);
  if (status) query = query.eq('status', status);
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (sort === 'most_supported') {
    query = query.order('support_count', { ascending: false });
  } else if (sort === 'trending') {
    query = query.order('support_count', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
