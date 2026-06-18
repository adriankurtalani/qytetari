import { Suspense } from 'react';
import { Newspaper } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { StoryCard } from '@/components/stories/StoryCard';
import { StoryFilters } from '@/components/stories/StoryFilters';
import { storyMatchesFilter, type StoryFilter } from '@/lib/story-status';
import type { ReportStory } from '@/lib/types';

interface LajmePageProps {
  searchParams: Promise<{ filter?: StoryFilter }>;
}

const STORY_SELECT = `
  *,
  report:reports(
    *,
    category:categories(*),
    photos:report_photos(*)
  )
`;

export default async function LajmePage({ searchParams }: LajmePageProps) {
  const params = await searchParams;
  const filter = params.filter || 'all';
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from('report_stories')
    .select(STORY_SELECT)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedStoryIds = new Set<string>();
  const allStories = (stories as ReportStory[]) || [];

  if (user && allStories.length > 0) {
    const { data: likes } = await supabase
      .from('report_story_likes')
      .select('story_id')
      .eq('user_id', user.id)
      .in(
        'story_id',
        allStories.map((s) => s.id)
      );

    likedStoryIds = new Set((likes || []).map((l) => l.story_id));
  }

  const enriched = allStories.map((story) => ({
    ...story,
    user_liked: likedStoryIds.has(story.id),
  }));

  const filtered = enriched.filter((story) => storyMatchesFilter(story, filter));

  return (
    <div className="page-container py-6 sm:py-10 max-w-4xl animate-fade-in">
      <PageHeader
        badge="Faza 4"
        title="Lajmet e Raportimeve"
        description="Transparencë publike: çfarë u zgjidh, çfarë është ende në proces, dhe pse disa raporte nuk u zgjidhën ende."
      >
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
        </div>
      </PageHeader>

      <Suspense fallback={<div className="h-10 bg-slate-100 rounded-xl animate-pulse mt-6" />}>
        <div className="mt-6 sm:mt-8">
          <StoryFilters />
        </div>
      </Suspense>

      <p className="text-sm text-slate-500 mt-4">
        {filtered.length} lajme publike
      </p>

      <div className="mt-6 space-y-6">
        {filtered.map((story) => (
          <StoryCard key={story.id} story={story} isLoggedIn={!!user} />
        ))}

        {filtered.length === 0 && (
          <div className="card rounded-2xl p-12 text-center">
            <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Nuk ka lajme ende</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Ekipi do të publikojë këtu përditësime për raportimet e zgjidhura dhe ato që ende
              presin zgjidhje.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
