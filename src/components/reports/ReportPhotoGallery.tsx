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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const altBase = title || 'Foto e raportimit';
  const activePhoto = photos[selectedIndex];

  if (!photos.length) return null;

  return (
    <>
      <div className="border-b border-slate-100">
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
          <div className="space-y-2.5 p-3 sm:p-4">
            <div className="group relative">
              <PhotoFrame
                src={activePhoto.url}
                alt={`${altBase} — foto ${selectedIndex + 1}`}
                variant="gallery"
                priority
                onClick={() => setLightboxIndex(selectedIndex)}
                className="rounded-xl"
              />
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                <span className="sm:hidden">Prek për të zmadhuar</span>
                <span className="hidden sm:inline">Kliko për të zmadhuar</span>
              </div>
              <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white tabular-nums backdrop-blur-sm">
                {selectedIndex + 1} / {photos.length}
              </div>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 snap-x snap-mandatory"
              role="list"
              aria-label="Miniatura të fotografive"
            >
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  role="listitem"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Shfaq foto ${index + 1}`}
                  aria-current={selectedIndex === index ? 'true' : undefined}
                  className={cn(
                    'relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80 snap-start transition-shadow',
                    photoFrameRing(selectedIndex === index)
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
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
          onIndexChange={(index) => {
            setLightboxIndex(index);
            setSelectedIndex(index);
          }}
          title={title}
        />
      )}
    </>
  );
}
