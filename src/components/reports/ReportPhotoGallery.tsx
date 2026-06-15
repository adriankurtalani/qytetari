'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

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

  useEffect(() => {
    if (lightboxIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, photos.length]);

  if (!photos.length) return null;

  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200">
        {photos.length === 1 ? (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="group relative w-full block cursor-zoom-in"
            aria-label="Hap fotografinë në madhësi të plotë"
          >
            <div className="relative w-full min-h-[200px] sm:min-h-[280px] max-h-[360px] sm:max-h-[520px] flex items-center justify-center p-2">
              <Image
                src={photos[0].url}
                alt={title || 'Foto e raportimit'}
                width={1200}
                height={800}
                className="max-h-[340px] sm:max-h-[500px] w-auto h-auto max-w-full object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1 rounded-full bg-black/60 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-3.5 w-3.5" />
              Kliko për të parë
            </div>
          </button>
        ) : (
          <div className="p-3 space-y-3">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="group relative w-full block cursor-zoom-in"
            >
              <div className="relative w-full min-h-[180px] sm:min-h-[240px] max-h-[300px] sm:max-h-[420px] flex items-center justify-center">
                <Image
                  src={photos[0].url}
                  alt={title || 'Foto e raportimit'}
                  width={1200}
                  height={800}
                  className="max-h-[280px] sm:max-h-[400px] w-auto h-auto max-w-full object-contain rounded-lg"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-3.5 w-3.5" />
                Kliko për të parë
              </div>
            </button>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="relative shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-zoom-in"
                >
                  <Image src={photo.url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 safe-top safe-bottom"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 sm:right-4 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Mbyll"
          >
            <X className="h-6 w-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Fotoja e mëparshme"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % photos.length);
                }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Fotoja tjetër"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </>
          )}

          <div
            className="relative max-h-[90vh] max-w-[95vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex].url}
              alt={title || 'Foto e raportimit'}
              className="max-h-[90vh] max-w-[95vw] w-auto h-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
