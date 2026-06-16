'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import type { Business } from '@/lib/types';

interface BusinessClaimFormProps {
  business: Pick<Business, 'slug' | 'id' | 'name' | 'city' | 'claim_status'>;
}

export function BusinessClaimForm({ business }: BusinessClaimFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [certificatePath, setCertificatePath] = useState<string | null>(null);
  const [certificateName, setCertificateName] = useState<string | null>(null);
  const [form, setForm] = useState({ official_email: '', fiscal_number: '' });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload/business-document', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Ngarkimi dështoi', type: 'error' });
        return;
      }

      setCertificatePath(data.path);
      setCertificateName(file.name);
      setToast({ message: 'Certifikata u ngarkua', type: 'success' });
    } catch {
      setToast({ message: 'Gabim gjatë ngarkimit', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!certificatePath) {
      setToast({ message: 'Ngarkoni certifikatën e biznesit', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${business.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          official_email: form.official_email,
          fiscal_number: form.fiscal_number,
          certificate_url: certificatePath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Dorëzimi dështoi', type: 'error' });
        return;
      }

      setToast({
        message: 'Kërkesa u dorëzua! Ekipi do ta shqyrtojë brenda 1-3 ditëve pune.',
        type: 'success',
      });

      setTimeout(() => router.push('/business'), 2000);
    } catch {
      setToast({ message: 'Gabim i papritur', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Zyrtar i Biznesit"
          type="email"
          placeholder="info@biznesi.com"
          value={form.official_email}
          onChange={(e) => setForm({ ...form, official_email: e.target.value })}
          required
        />

        <Input
          label="Numri Fiskal (NUI)"
          placeholder="6xxxxxxxxx"
          value={form.fiscal_number}
          onChange={(e) => setForm({ ...form, fiscal_number: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Certifikata e Biznesit <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Ngarkoni certifikatën e regjistrimit të biznesit (PDF ose foto).
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {certificateName ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-emerald-800 truncate">{certificateName}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto shrink-0"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                Ndrysho
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-600">
                {uploading ? 'Duke ngarkuar...' : 'Klikoni për të ngarkuar certifikatën'}
              </span>
            </button>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading || uploading || !certificatePath}>
          {loading ? 'Duke dorëzuar...' : 'Dorëzo Kërkesën e Verifikimit'}
        </Button>
      </form>
    </>
  );
}
