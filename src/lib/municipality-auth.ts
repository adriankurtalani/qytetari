import { createClient } from '@/lib/supabase/server';
import type { Profile } from './types';

export interface MunicipalitySession {
  user: { id: string };
  profile: Pick<Profile, 'role' | 'city' | 'full_name' | 'is_verified'>;
}

export async function verifyMunicipality(): Promise<MunicipalitySession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, city, full_name, is_verified')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'municipality') {
    return null;
  }

  return { user: { id: user.id }, profile };
}
