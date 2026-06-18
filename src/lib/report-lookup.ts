import type { SupabaseClient } from '@supabase/supabase-js';
import { isReportNumberParam, isUuid } from './report-url';

export async function fetchReportByRouteParam<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  param: string,
  select: string
): Promise<{ data: T | null; error: { message: string } | null }> {
  if (isReportNumberParam(param)) {
    const result = await supabase
      .from('reports')
      .select(select)
      .eq('report_number', Number(param))
      .maybeSingle();
    return { data: (result.data as T | null) ?? null, error: result.error };
  }

  if (isUuid(param)) {
    const result = await supabase.from('reports').select(select).eq('id', param).maybeSingle();
    return { data: (result.data as T | null) ?? null, error: result.error };
  }

  return { data: null, error: { message: 'Invalid report reference' } };
}
