'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { LocationPickerWrapper } from '@/components/map/LocationPickerWrapper';
import type { LocationValue } from '@/lib/location-types';
import {
  getLaunchCitySelectOptions,
  isLaunchCity,
  OTHER_CITIES_LAUNCH_MESSAGE,
  LAUNCH_CITY,
} from '@/lib/city-launch';
import { MAX_PHOTOS_PER_REPORT, MODERATION_MESSAGE, PHOTO_UPLOAD_GUIDE } from '@/lib/constants';
import { generateAnonymousId } from '@/lib/utils';
import type { Category } from '@/lib/types';

interface ReportFormProps {
  categories: Category[];
  isLoggedIn: boolean;
  isAnonymous: boolean;
}

export function ReportForm({ categories, isLoggedIn, isAnonymous }: ReportFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    business_name: '',
    city: LAUNCH_CITY,
  });

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS_PER_REPORT - photos.length;

    if (remaining <= 0) {
      setToast({ message: `Maksimumi ${MAX_PHOTOS_PER_REPORT} foto për raportim`, type: 'error' });
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      setToast({
        message: `Vetëm ${remaining} foto u shtuan (maksimumi ${MAX_PHOTOS_PER_REPORT})`,
        type: 'success',
      });
    }

    const newPhotos = [...photos, ...toAdd];
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (photos.length === 0) {
      setToast({ message: 'Fotografia është e domosdoshme', type: 'error' });
      return;
    }

    if (!location) {
      setToast({ message: 'Lokacioni është i domosdoshëm. Lejoni qasjen në lokacion.', type: 'error' });
      return;
    }

    if (!isLaunchCity(form.city)) {
      setToast({ message: OTHER_CITIES_LAUNCH_MESSAGE, type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const photoUrls: string[] = [];

      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setToast({
            message: uploadData.error || 'Ngarkimi i fotos dështoi',
            type: 'error',
          });
          return;
        }

        photoUrls.push(uploadData.url);
      }

      const body: Record<string, unknown> = {
        ...form,
        latitude: location.lat,
        longitude: location.lng,
        photo_urls: photoUrls,
      };

      if (!isLoggedIn || isAnonymous) {
        body.anonymous_id = generateAnonymousId();
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Gabim gjatë dërgimit', type: 'error' });
        return;
      }

      setToast({ message: MODERATION_MESSAGE, type: 'success' });
      setTimeout(() => router.push('/'), 3000);
    } catch {
      setToast({ message: 'Gabim gjatë dërgimit të raportimit', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Detajet</h3>
        <Input
          label="Titulli *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          placeholder="Përshkruani shkurt problemin"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Përshkrimi *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={5}
            placeholder="Jepni detaje të plota rreth problemit..."
            className="input-field resize-none text-base sm:text-sm"
          />
        </div>

        <Select
          label="Kategoria *"
          options={[
            { value: '', label: 'Zgjidhni kategorinë' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          required
        />

        <Select
          label="Qyteti *"
          options={getLaunchCitySelectOptions('Zgjidhni qytetin')}
          value={form.city}
          onChange={(e) => {
            setForm({ ...form, city: e.target.value });
            setLocation(null);
          }}
          hint={OTHER_CITIES_LAUNCH_MESSAGE}
          required
        />

        <Input
          label="Emri i Biznesit (opsional)"
          value={form.business_name}
          onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          placeholder="Nëse problemi lidhet me një biznes"
        />
        </section>

        <section className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Fotografi</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ngarko foto * (max {MAX_PHOTOS_PER_REPORT})
          </label>
          <div className="flex flex-wrap gap-3">
            {photoPreviews.map((preview, i) => (
              <div key={i} className="relative h-28 w-28 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100">
                <img src={preview} alt={`Parapamje foto ${i + 1}`} className="h-full w-full object-contain p-0.5" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS_PER_REPORT && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Camera className="h-6 w-6" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
            disabled={photos.length >= MAX_PHOTOS_PER_REPORT}
          />
          <p className="mt-2 text-xs text-slate-500">
            {photos.length}/{MAX_PHOTOS_PER_REPORT} foto të ngarkuara · rekomandohet {PHOTO_UPLOAD_GUIDE.recommendedPx.width}×{PHOTO_UPLOAD_GUIDE.recommendedPx.height}px ({PHOTO_UPLOAD_GUIDE.aspectRatio}), foto e plotë pa prerje
          </p>
        </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Lokacioni</h3>
        <div>
          <LocationPickerWrapper value={location} onChange={setLocation} city={form.city} />
        </div>
        </section>

        <Button type="submit" size="lg" loading={loading} className="w-full shadow-md">
          Dërgo Raportimin
        </Button>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
