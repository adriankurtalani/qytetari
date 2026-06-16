import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recalculateCitizenTrust } from '@/lib/citizen-trust';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trust = await recalculateCitizenTrust(supabase, user.id);

  if (!trust) {
    return NextResponse.json({ error: 'Trust score applies to citizens only' }, { status: 400 });
  }

  return NextResponse.json(trust);
}
