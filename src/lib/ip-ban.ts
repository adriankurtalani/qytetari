import { createServiceClient } from '@/lib/supabase/server';
import type { BanType } from '@/lib/types';

export async function checkIPBan(ipAddress: string): Promise<{
  banned: boolean;
  banType?: BanType;
  reason?: string;
}> {
  const supabase = createServiceClient();

  const { data: bans } = await supabase
    .from('ip_bans')
    .select('*')
    .eq('ip_address', ipAddress)
    .order('created_at', { ascending: false });

  if (!bans || bans.length === 0) {
    return { banned: false };
  }

  for (const ban of bans) {
    if (ban.ban_type === 'permanent') {
      return { banned: true, banType: 'permanent', reason: ban.reason };
    }

    if (ban.ban_type === 'temporary' && ban.expires_at) {
      const expiresAt = new Date(ban.expires_at);
      if (expiresAt > new Date()) {
        return { banned: true, banType: 'temporary', reason: ban.reason };
      }
    }
  }

  return { banned: false };
}

export async function banIP(
  ipAddress: string,
  reason: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('ip_bans')
    .select('*')
    .eq('ip_address', ipAddress)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const newViolationCount = (existing.violation_count || 1) + 1;

    if (newViolationCount >= 2 || existing.ban_type === 'temporary') {
      await supabase.from('ip_bans').insert({
        ip_address: ipAddress,
        reason: `Ban i përhershëm: ${reason}`,
        ban_type: 'permanent',
        violation_count: newViolationCount,
      });
    } else {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from('ip_bans').insert({
        ip_address: ipAddress,
        reason,
        ban_type: 'temporary',
        expires_at: expiresAt.toISOString(),
        violation_count: newViolationCount,
      });
    }
  } else {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase.from('ip_bans').insert({
      ip_address: ipAddress,
      reason,
      ban_type: 'temporary',
      expires_at: expiresAt.toISOString(),
      violation_count: 1,
    });
  }
}

export async function getBannedWords(): Promise<string[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('banned_words')
    .select('word')
    .eq('is_active', true);

  return data?.map((w) => w.word) || [];
}
