'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Fjalëkalimi u përditësua me sukses!', type: 'success' });
      setTimeout(() => router.push('/auth/login'), 2000);
    }
    setLoading(false);
  }

  return (
    <>
      <AuthLayout
        title="Vendos fjalëkalimin e ri"
        subtitle="Zgjidhni një fjalëkalim të fortë për llogarinë tuaj"
        footer={
          <>
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-800">
              Kthehu te hyrja
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Fjalëkalimi i Ri"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <Lock className="h-4 w-4 mr-2" />
            Përditëso fjalëkalimin
          </Button>
        </form>
      </AuthLayout>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
