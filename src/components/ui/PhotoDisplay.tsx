'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoLightboxProps {
  photos: { url: string; alt?: string }[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  title?: string;
}

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  title,
}: PhotoLightboxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && photos.length > 1) {
        onIndexChange((index + 1) % photos.length);
      }
      if (e.key === 'ArrowLeft' && photos.length > 1) {
        onIndexChange((index - 1 + photos.length) % photos.length);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [index, onClose, onIndexChange, photos.length]);

  const current = photos[index];
  if (!current || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] bg-black touch-none"
      role="dialog"
      aria-modal
      aria-label={title || 'Fotografia e raportimit'}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Mbyll fotografinë"
      />

      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-4 pointer-events-none"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {photos.length > 1 ? (
          <p className="pointer-events-auto rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/90 tabular-nums backdrop-blur-sm">
            {index + 1} / {photos.length}
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur-sm"
          aria-label="Mbyll"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top) + 2.5rem))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + photos.length) % photos.length);
            }}
            className="absolute left-2 sm:left-4 z-20 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur-sm"
            aria-label="Fotoja e mëparshme"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt || title || 'Foto e raportimit'}
          className="max-h-full max-w-full h-full w-full object-contain select-none"
          draggable={false}
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % photos.length);
            }}
            className="absolute right-2 sm:right-4 z-20 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur-sm"
            aria-label="Fotoja tjetër"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

interface PhotoFrameProps {
  src: string;
  alt: string;
  variant?: 'feed' | 'gallery' | 'thumb' | 'preview';
  priority?: boolean;
  className?: string;
  onClick?: () => void;
}

const frameVariants = {
  feed: 'aspect-[4/3] w-full bg-slate-100',
  /** Mobile: 4:3 full width. Desktop: fixed height cap so hero does not dominate the page. */
  gallery: 'aspect-[4/3] w-full bg-slate-100 md:aspect-auto md:h-[380px] lg:h-[400px]',
  thumb: 'h-[5.5rem] w-[5.5rem] shrink-0 bg-slate-100 rounded-xl',
  preview: 'h-28 w-28 bg-slate-100 rounded-xl',
};

export function PhotoFrame({
  src,
  alt,
  variant = 'feed',
  priority,
  className,
  onClick,
}: PhotoFrameProps) {
  const isThumb = variant === 'thumb' || variant === 'preview';

  const content = isThumb ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-contain p-0.5" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-contain p-1 sm:p-2"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );

  const frameClass = cn(
    'relative overflow-hidden',
    frameVariants[variant],
    onClick && 'cursor-zoom-in',
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(frameClass, 'block text-left w-full')} aria-label={`Hap: ${alt}`}>
        {content}
      </button>
    );
  }

  return <div className={frameClass}>{content}</div>;
}

export function photoFrameRing(active?: boolean) {
  return cn(
    'ring-2 ring-offset-2 ring-offset-white transition-shadow',
    active ? 'ring-blue-500' : 'ring-transparent hover:ring-slate-200'
  );
}
