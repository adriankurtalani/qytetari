'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function useAuthSession() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncProfile(authUser: User | null) {
      if (cancelled) return;

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setUnreadCount(0);
        setReady(true);
        return;
      }

      setUser(authUser);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (cancelled) return;

      setProfile(data);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_read', false);

      if (!cancelled) {
        setUnreadCount(count || 0);
        setReady(true);
      }
    }

    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      syncProfile(initialUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      syncProfile(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { supabase, user, profile, unreadCount, ready };
}
