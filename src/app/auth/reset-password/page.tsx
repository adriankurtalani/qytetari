'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <>
      <AuthLayout
        title="Rivendos fjalëkalimin"
        subtitle="Do t'ju dërgojmë një link për të vendosur fjalëkalimin e ri"
        footer={
          <>
            Kujtove fjalëkalimin?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-800">
              Hyr në platformë
            </Link>
          </>
        }
      >
        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 mb-4">
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="text-slate-700 leading-relaxed">
              U dërgua një link për rivendosjen e fjalëkalimit në emailin tuaj.
            </p>
            <Link href="/auth/login" className="text-blue-600 text-sm font-medium mt-6 inline-block hover:text-blue-800">
              Kthehu te hyrja
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emri@email.com"
              required
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <Mail className="h-4 w-4 mr-2" />
              Dërgo linkun
            </Button>
          </form>
        )}
      </AuthLayout>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
