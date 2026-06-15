'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { KOSOVO_CITIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    city: '',
    anonymous_mode: false,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          username: data.username || '',
          city: data.city || '',
          anonymous_mode: data.anonymous_mode,
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', profile!.id);

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Profili u përditësua!', type: 'success' });
      setProfile({ ...profile!, ...form });
    }
    setSaving(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const fileName = `avatar-${profile.id}-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from('report-photos')
      .upload(fileName, file);

    if (error) {
      setToast({ message: error.message, type: 'error' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(data.path);

    await supabase
      .from('profiles')
      .update({ profile_photo_url: urlData.publicUrl })
      .eq('id', profile.id);

    setProfile({ ...profile, profile_photo_url: urlData.publicUrl });
    setToast({ message: 'Fotoja u ngarkua!', type: 'success' });
  }

  if (loading) return <LoadingSpinner />;

  const initials = (profile?.full_name?.[0] || profile?.username?.[0] || '?').toUpperCase();

  return (
    <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Llogaria"
        title="Profili Im"
        description="Menaxhoni informacionin tuaj personal dhe preferencat e privatësisë."
      >
        <div className="relative h-12 w-12 rounded-2xl overflow-hidden hero-gradient shadow-md flex items-center justify-center">
          {profile?.profile_photo_url ? (
            <Image src={profile.profile_photo_url} alt="" fill className="object-cover" />
          ) : (
            <span className="text-white text-lg font-bold">{initials}</span>
          )}
        </div>
      </PageHeader>

      <Card className="mt-8" padding="md">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
          <div className="relative h-20 w-20 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            {profile?.profile_photo_url ? (
              <Image src={profile.profile_photo_url} alt="" fill className="object-cover" />
            ) : (
              <User className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                <Camera className="h-4 w-4" />
                Ndrysho foton
              </span>
            </label>
            {profile && (
              <p className="text-xs text-slate-400 mt-2">
                Anëtar që nga {formatDate(profile.created_at)}
              </p>
            )}
            {profile?.role === 'admin' && (
              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Administrator
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Emri i Plotë"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Select
            label="Qyteti"
            options={[
              { value: '', label: 'Zgjidhni qytetin' },
              ...KOSOVO_CITIES.map((c) => ({ value: c, label: c })),
            ]}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />

          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-200 transition-colors">
            <input
              type="checkbox"
              checked={form.anonymous_mode}
              onChange={(e) => setForm({ ...form, anonymous_mode: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Mënyra anonime</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Raportimet tuaja nuk do të tregojnë emrin tuaj
              </p>
            </div>
          </label>

          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            Ruaj Ndryshimet
          </Button>
        </form>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
