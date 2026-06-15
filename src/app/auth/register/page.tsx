'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { createClient } from '@/lib/supabase/client';
import { KOSOVO_CITIES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          username: form.username,
        },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      await supabase
        .from('profiles')
        .update({ city: form.city, is_verified: true })
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '');

      setToast({
        message: 'Regjistrimi u krye! Kontrolloni emailin për verifikim.',
        type: 'success',
      });
      setTimeout(() => router.push('/auth/login'), 3000);
    }
    setLoading(false);
  }

  return (
    <>
      <AuthLayout
        title="Krijo llogari"
        subtitle="Bashkohu me mijëra qytetarë që raportojnë probleme"
        footer={
          <>
            Keni llogari?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-800">
              Hyr këtu
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Emri i Plotë"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Adrian Kurtalani"
            required
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="adrian_k"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="emri@email.com"
            required
          />
          <Input
            label="Fjalëkalimi"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="Minimum 6 karaktere"
            required
            minLength={6}
          />
          <Select
            label="Qyteti"
            options={[
              { value: '', label: 'Zgjidhni qytetin' },
              ...KOSOVO_CITIES.map((c) => ({ value: c, label: c })),
            ]}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Krijo llogarinë
          </Button>
        </form>
      </AuthLayout>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
