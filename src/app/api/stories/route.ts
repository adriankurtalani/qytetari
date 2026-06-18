import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STORY_SELECT = `
  *,
  report:reports(
    *,
    category:categories(*),
    photos:report_photos(*)
  )
`;

export async function GET() {
  const supabase = await createClient();

  const { data: stories, error } = await supabase
    .from('report_stories')
    .select(STORY_SELECT)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedStoryIds = new Set<string>();

  if (user && stories?.length) {
    const { data: likes } = await supabase
      .from('report_story_likes')
      .select('story_id')
      .eq('user_id', user.id)
      .in(
        'story_id',
        stories.map((s) => s.id)
      );

    likedStoryIds = new Set((likes || []).map((l) => l.story_id));
  }

  const result = (stories || []).map((story) => ({
    ...story,
    user_liked: likedStoryIds.has(story.id),
  }));

  return NextResponse.json(result);
}
