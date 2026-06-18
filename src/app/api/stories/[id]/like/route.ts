import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkIPBan } from '@/lib/ip-ban';
import { getClientIP } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storyId } = await params;
  const ip = getClientIP(request);
  const banCheck = await checkIPBan(ip);

  if (banCheck.banned) {
    return NextResponse.json({ error: 'Jeni i bllokuar' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { anonymous_id } = body as { anonymous_id?: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !anonymous_id) {
    return NextResponse.json({ error: 'Identiteti i kërkuar' }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  const { data: story } = await serviceClient
    .from('report_stories')
    .select('id, like_count, is_published')
    .eq('id', storyId)
    .single();

  if (!story?.is_published) {
    return NextResponse.json({ error: 'Lajmi nuk u gjet' }, { status: 404 });
  }

  let existingLike;
  if (user) {
    const { data } = await serviceClient
      .from('report_story_likes')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .maybeSingle();
    existingLike = data;
  } else if (anonymous_id) {
    const { data } = await serviceClient
      .from('report_story_likes')
      .select('id')
      .eq('story_id', storyId)
      .eq('anonymous_id', anonymous_id)
      .maybeSingle();
    existingLike = data;
  }

  if (existingLike) {
    await serviceClient.from('report_story_likes').delete().eq('id', existingLike.id);

    const { data: updated } = await serviceClient
      .from('report_stories')
      .select('like_count')
      .eq('id', storyId)
      .single();

    return NextResponse.json({
      liked: false,
      like_count: updated?.like_count ?? Math.max(story.like_count - 1, 0),
    });
  }

  const likeData: Record<string, string> = { story_id: storyId };
  if (user) likeData.user_id = user.id;
  else likeData.anonymous_id = anonymous_id!;

  const { error: insertError } = await serviceClient.from('report_story_likes').insert(likeData);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { data: updated } = await serviceClient
    .from('report_stories')
    .select('like_count')
    .eq('id', storyId)
    .single();

  return NextResponse.json({
    liked: true,
    like_count: updated?.like_count ?? story.like_count + 1,
  });
}
