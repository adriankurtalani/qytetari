'use client';

import { useState } from 'react';
import { PhotoFrame, PhotoLightbox } from '@/components/ui/PhotoDisplay';
import type { ReportPhoto } from '@/lib/types';

interface BusinessPhotoGridProps {
  photos: ReportPhoto[];
  businessName: string;
}

export function BusinessPhotoGrid({ photos, businessName }: BusinessPhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        Ende nuk ka fotografi publike nga raportimet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {photos.map((photo, index) => (
          <PhotoFrame
            key={photo.id}
            src={photo.url}
            alt={`Foto raportimi — ${businessName}`}
            variant="feed"
            onClick={() => setLightboxIndex(index)}
            className="rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors"
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p, i) => ({
            url: p.url,
            alt: `Foto raportimi — ${businessName} (${i + 1})`,
          }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          title={businessName}
        />
      )}
    </>
  );
}
