import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessBySlug } from '@/lib/business-slug';
import { fetchBusinessPublicProfile } from '@/lib/business-profile';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  const business = await getBusinessBySlug(supabase, slug);
  if (!business) {
    return NextResponse.json({ error: 'Biznesi nuk u gjet' }, { status: 404 });
  }

  const profile = await fetchBusinessPublicProfile(supabase, business);
  return NextResponse.json(profile);
}
