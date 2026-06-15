'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Settings, ImageIcon, Globe, Home, Layout, Save, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackLink } from '@/components/ui/BackLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toast } from '@/components/ui/Toast';
import { SiteLogo } from '@/components/layout/SiteLogo';
import { SiteSettingsProvider } from '@/components/providers/SiteSettingsProvider';
import type { SiteSettings } from '@/lib/types';

type FormState = Omit<SiteSettings, 'id' | 'updated_at' | 'updated_by'>;

export default function AdminSiteSettingsPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/site-settings');
        if (res.status === 403) {
          router.push('/');
          return;
        }
        const data = await res.json();
        if (res.ok) {
          const { id, updated_at, updated_by, _needsMigration, ...rest } = data;
          setForm(rest as FormState);
          if (_needsMigration) setNeedsMigration(true);
        } else {
          setToast({ message: data.error || 'Gabim gjatë ngarkimit', type: 'error' });
        }
      } catch {
        setToast({ message: 'Gabim gjatë ngarkimit të cilësimeve', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function uploadImage(file: File, target: 'logo_url' | 'favicon_url') {
    setUploading(target === 'logo_url' ? 'logo' : 'favicon');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error || 'Ngarkimi dështoi', type: 'error' });
        return;
      }
      updateField(target, data.url);
      setToast({ message: 'Imazhi u ngarkua!', type: 'success' });
    } finally {
      setUploading(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);

    const res = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setToast({ message: data.error || 'Gabim gjatë ruajtjes', type: 'error' });
    } else {
      setToast({ message: 'Cilësimet u ruajtën me sukses!', type: 'success' });
      const { id, updated_at, updated_by, ...rest } = data;
      setForm(rest);
    }
    setSaving(false);
  }

  if (loading) return <LoadingSpinner label="Duke ngarkuar cilësimet..." />;
  if (!form) {
    return (
      <div className="page-container-narrow py-10 text-center">
        <p className="text-slate-600">Nuk u ngarkuan cilësimet. Provoni përsëri.</p>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const previewSettings: SiteSettings = {
    id: 1,
    ...form,
    updated_at: new Date().toISOString(),
    updated_by: null,
  };

  return (
    <SiteSettingsProvider settings={previewSettings}>
      <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
        <BackLink href="/admin" label="Kthehu te paneli" />

      <PageHeader
        badge="Administrim"
        title="Cilësimet e Platformës"
        description="Menaxhoni emrin, logon, favicon-in, titullin dhe përmbajtjen bazë të faqes."
      >
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
        </div>
      </PageHeader>

      {needsMigration && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Migrimi i databazës mungon.</strong> Ekzekutoni{' '}
          <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded">005_site_settings.sql</code>{' '}
          në Supabase SQL Editor për të ruajtur ndryshimet. Deri atëherë shfaqen vlerat e paracaktuara.
        </div>
      )}

        <form onSubmit={handleSave} className="mt-6 sm:mt-8 space-y-6">
          {/* Branding */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              Marka & Identiteti
            </h2>

            <div className="flex flex-col sm:flex-row gap-6 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <SiteLogo size="lg" />
                <div>
                  <p className="font-bold text-slate-900">{form.platform_name}</p>
                  <p className="text-xs text-slate-500">{form.platform_tagline}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 sm:ml-auto sm:self-center">
                Parapamje e logot në navbar
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Emri i Platformës"
                value={form.platform_name}
                onChange={(e) => updateField('platform_name', e.target.value)}
                required
              />
              <Input
                label="Nëntitulli (nën emrin në navbar)"
                value={form.platform_tagline}
                onChange={(e) => updateField('platform_tagline', e.target.value)}
              />
              <Input
                label="Shkurtimi i Logos (kur nuk ka imazh)"
                value={form.logo_abbr}
                onChange={(e) => updateField('logo_abbr', e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ZQ"
                maxLength={4}
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                  <div className="flex items-center gap-3">
                    {form.logo_url ? (
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200">
                        <Image src={form.logo_url} alt="Logo" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Pa logo
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        loading={uploading === 'logo'}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" /> Ngarko
                      </Button>
                      {form.logo_url && (
                        <button
                          type="button"
                          onClick={() => updateField('logo_url', null)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Hiq
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'logo_url');
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Favicon</label>
                  <div className="flex items-center gap-3">
                    {form.favicon_url ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-200">
                        <Image src={form.favicon_url} alt="Favicon" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                        —
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        loading={uploading === 'favicon'}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" /> Ngarko
                      </Button>
                      {form.favicon_url && (
                        <button
                          type="button"
                          onClick={() => updateField('favicon_url', null)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Hiq
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'favicon_url');
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-2">Rekomandohet 32×32 ose 64×64 px</p>
                </div>
              </div>
            </div>
          </Card>

          {/* SEO */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Titulli & Përshkrimi (SEO)
            </h2>
            <div className="space-y-5">
              <Input
                label="Titulli i Faqes (tab i shfletuesit)"
                value={form.site_title}
                onChange={(e) => updateField('site_title', e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Përshkrimi Meta (SEO)
                </label>
                <textarea
                  value={form.site_description}
                  onChange={(e) => updateField('site_description', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Homepage */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-500" />
              Faqja Kryesore (Hero)
            </h2>
            <div className="space-y-5">
              <Input
                label="Badge (etiketa sipër titullit)"
                value={form.hero_badge}
                onChange={(e) => updateField('hero_badge', e.target.value)}
              />
              <Input
                label="Titulli Hero (bosh = emri i platformës)"
                value={form.hero_title || ''}
                onChange={(e) => updateField('hero_title', e.target.value || null)}
                placeholder={form.platform_name}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Përshkrimi Hero (bosh = përshkrimi meta)
                </label>
                <textarea
                  value={form.hero_description || ''}
                  onChange={(e) => updateField('hero_description', e.target.value || null)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder={form.site_description}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Butoni Kryesor"
                  value={form.hero_cta_primary}
                  onChange={(e) => updateField('hero_cta_primary', e.target.value)}
                />
                <Input
                  label="Butoni Dytësor"
                  value={form.hero_cta_secondary}
                  onChange={(e) => updateField('hero_cta_secondary', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Footer */}
          <Card padding="md">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
              <Layout className="h-4 w-4 text-blue-500" />
              Footer & Misioni
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Përshkrimi në Footer
                </label>
                <textarea
                  value={form.footer_description}
                  onChange={(e) => updateField('footer_description', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <Input
                label="Nëntitulli Footer"
                value={form.footer_tagline}
                onChange={(e) => updateField('footer_tagline', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Teksti i Misionit
                </label>
                <textarea
                  value={form.mission_text}
                  onChange={(e) => updateField('mission_text', e.target.value)}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto gap-2 min-h-[48px]">
            <Save className="h-4 w-4" />
            Ruaj Cilësimet
          </Button>
        </form>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </SiteSettingsProvider>
  );
}
