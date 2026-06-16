import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCanonicalCity } from '@/lib/city-utils';
import { recalculateCitizenTrust } from '@/lib/citizen-trust';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  const adminClient = createAdminClient();

  const { data: profiles, error } = await serviceClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const authUsersById = new Map(
    authData.users.map((u) => [u.id, u])
  );

  const users = (profiles || []).map((profile) => {
    const authUser = authUsersById.get(profile.id);
    const email = profile.email || authUser?.email || null;
    const meta = authUser?.user_metadata || {};
    const fullName =
      profile.full_name && profile.full_name !== 'User'
        ? profile.full_name
        : (meta.full_name as string) || null;
    const username =
      profile.username && !profile.username.startsWith('user_')
        ? profile.username
        : (meta.username as string) || profile.username;

    return {
      ...profile,
      email,
      full_name: fullName,
      username,
    };
  });

  return NextResponse.json(users);
}

export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, role, is_verified, city } = await request.json();
  const serviceClient = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (is_verified !== undefined) updates.is_verified = is_verified;
  if (city !== undefined) updates.city = city ? getCanonicalCity(city) : null;

  const { error } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (is_verified !== undefined) {
    await recalculateCitizenTrust(serviceClient, userId);
  }

  return NextResponse.json({ success: true });
}
