'use client';

import { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { PhotoFrame, PhotoLightbox, photoFrameRing } from '@/components/ui/PhotoDisplay';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
}

interface ReportPhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

export function ReportPhotoGallery({ photos, title }: ReportPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const altBase = title || 'Foto e raportimit';

  if (!photos.length) return null;

  return (
    <>
      <div className="border-b border-slate-100 bg-slate-50/80">
        {photos.length === 1 ? (
          <div className="group relative">
            <PhotoFrame
              src={photos[0].url}
              alt={altBase}
              variant="gallery"
              priority
              onClick={() => setLightboxIndex(0)}
              className="rounded-none"
            />
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                <span className="md:hidden">Prek për të zmadhuar</span>
                <span className="hidden md:inline">Kliko për të zmadhuar</span>
              </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 sm:p-4">
            <div className="group relative">
              <PhotoFrame
                src={photos[0].url}
                alt={`${altBase} — foto kryesore`}
                variant="gallery"
                priority
                onClick={() => setLightboxIndex(0)}
                className="rounded-xl"
              />
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                Prek për të zmadhuar
              </div>
            </div>
            <div
              className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
              role="list"
              aria-label="Miniatura të fotografive"
            >
              {photos.map((photo, index) => (
                <PhotoFrame
                  key={photo.id}
                  src={photo.url}
                  alt={`${altBase} — foto ${index + 1}`}
                  variant="thumb"
                  onClick={() => setLightboxIndex(index)}
                  className={cn(photoFrameRing(lightboxIndex === index), 'snap-start border border-slate-200/80')}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p, i) => ({ url: p.url, alt: `${altBase} — foto ${i + 1}` }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          title={title}
        />
      )}
    </>
  );
}
