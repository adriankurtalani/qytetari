import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

export type AdminDenyReason = 'unauthenticated' | 'no_profile' | 'not_admin';

export type AdminAccessResult =
  | { ok: true; user: User; role: UserRole }
  | { ok: false; reason: AdminDenyReason; role?: UserRole | null };

export async function getAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, reason: 'no_profile' };
  }

  if (profile.role !== 'admin') {
    return { ok: false, reason: 'not_admin', role: profile.role as UserRole };
  }

  return { ok: true, user, role: profile.role as UserRole };
}

export async function verifyAdmin() {
  const access = await getAdminAccess();
  return access.ok ? access.user : null;
}

export function adminDenyMessage(reason: AdminDenyReason, role?: UserRole | null): string {
  switch (reason) {
    case 'unauthenticated':
      return 'Duhet të jeni të kyçur për të hyrë në panelin e administratorit.';
    case 'no_profile':
      return 'Profili juaj nuk u gjet. Provoni të dilni dhe të hyni përsëri.';
    case 'not_admin':
      return role
        ? `Llogaria juaj ka rolin "${role}", jo "admin".`
        : 'Llogaria juaj nuk ka rol administratori.';
  }
}

export async function verifyModerator() {
  const access = await getAdminAccess();
  if (!access.ok) return null;
  return { user: access.user, role: 'admin' as const };
}
