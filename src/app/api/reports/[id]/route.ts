import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      category:categories(*),
      photos:report_photos(*),
      profile:profiles(id, username, full_name, anonymous_mode)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Raportimi nuk u gjet' }, { status: 404 });
  }

  return NextResponse.json(data);
}
