import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { getSiteSettings } from '@/lib/site-settings';

export default async function VerifyPage() {
  const settings = await getSiteSettings();

  return (
    <AuthLayout
      title="Emaili u verifikua"
      subtitle={`Llogaria juaj në ${settings.platform_name} është gati për përdorim`}
      footer={
        <>
          Gati për të raportuar?{' '}
          <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Hyr në platformë
          </Link>
        </>
      }
    >
      <div className="text-center py-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-6">
          <CheckCircle className="h-9 w-9 text-emerald-500" />
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">
          Verifikimi u krye me sukses. Tani mund të hyni dhe të filloni të raportoni probleme në
          komunitetin tuaj.
        </p>
        <Link href="/auth/login">
          <Button size="lg" className="w-full">
            Hyr në platformë
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
