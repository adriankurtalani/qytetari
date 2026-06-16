'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setToast({ message: error.message, type: 'error' });
      setLoading(false);
      return;
    }

    await router.refresh();

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    const destination =
      redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/';

    router.replace(destination);
    setLoading(false);
  }

  return (
    <>
      <AuthLayout
        title="Mirë se u kthyet"
        subtitle="Hyni në llogarinë tuaj për të vazhduar"
        footer={
          <>
            Nuk keni llogari?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-800">
              Regjistrohu falas
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="emri@email.com"
            required
          />
          <Input
            label="Fjalëkalimi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="text-right">
            <Link href="/auth/reset-password" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Keni harruar fjalëkalimin?
            </Link>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Hyr në platformë
          </Button>
        </form>
      </AuthLayout>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
