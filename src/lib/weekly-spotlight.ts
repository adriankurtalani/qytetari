import type { SupabaseClient } from '@supabase/supabase-js';

export async function setWeeklySpotlight(
  supabase: SupabaseClient,
  reportId: string,
  pinned: boolean
): Promise<{ success: boolean; error?: string }> {
  if (pinned) {
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('city')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Raportimi nuk u gjet' };
    }

    await supabase
      .from('reports')
      .update({ is_weekly_spotlight: false })
      .eq('city', report.city)
      .eq('is_weekly_spotlight', true);

    const { error: pinError } = await supabase
      .from('reports')
      .update({ is_weekly_spotlight: true })
      .eq('id', reportId);

    if (pinError) {
      return { success: false, error: pinError.message };
    }

    return { success: true };
  }

  const { error: unpinError } = await supabase
    .from('reports')
    .update({ is_weekly_spotlight: false })
    .eq('id', reportId);

  if (unpinError) {
    return { success: false, error: unpinError.message };
  }

  return { success: true };
}
