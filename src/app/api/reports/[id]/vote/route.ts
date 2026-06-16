import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkIPBan, banIP } from '@/lib/ip-ban';
import { getClientIP } from '@/lib/utils';
import { recalculateCitizenTrust } from '@/lib/citizen-trust';

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

  const { vote_type, anonymous_id } = await request.json();

  if (!vote_type || !['support', 'disagree'].includes(vote_type)) {
    return NextResponse.json({ error: 'Lloji i votës i pavlefshëm' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceClient = await createServiceClient();

  let existingVote;
  if (user) {
    const { data } = await serviceClient
      .from('votes')
      .select('*')
      .eq('report_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    existingVote = data;
  } else if (anonymous_id) {
    const { data } = await serviceClient
      .from('votes')
      .select('*')
      .eq('report_id', id)
      .eq('anonymous_id', anonymous_id)
      .maybeSingle();
    existingVote = data;
  }

  let isNewVote = false;
  if (existingVote) {
    if (existingVote.vote_type === vote_type) {
      return NextResponse.json({ error: 'Keni votuar tashmë' }, { status: 400 });
    }

    await serviceClient
      .from('votes')
      .update({ vote_type })
      .eq('id', existingVote.id);
  } else {
    const voteData: Record<string, unknown> = {
      report_id: id,
      vote_type,
    };

    if (user) {
      voteData.user_id = user.id;
    } else if (anonymous_id) {
      voteData.anonymous_id = anonymous_id;
    } else {
      return NextResponse.json({ error: 'Identiteti i kërkuar' }, { status: 400 });
    }

    const { error } = await serviceClient.from('votes').insert(voteData);
    if (error) {
      await banIP(ip, 'Përpjekje e dyfishtë për votim');
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    isNewVote = true;
  }

  if (user && isNewVote) {
    await recalculateCitizenTrust(serviceClient, user.id);
  }

  const { data: report } = await serviceClient
    .from('reports')
    .select('support_count, disagree_count')
    .eq('id', id)
    .single();

  return NextResponse.json({
    support_count: report?.support_count || 0,
    disagree_count: report?.disagree_count || 0,
    user_vote: vote_type,
  });
}
