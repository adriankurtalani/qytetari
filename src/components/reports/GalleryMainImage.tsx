'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GalleryMainImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  onOpenLightbox?: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function getTouchDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

export function GalleryMainImage({
  src,
  alt,
  priority,
  className,
  onOpenLightbox,
}: GalleryMainImageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const gestureRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    panStart: { x: 0, y: 0 },
    offsetStart: { x: 0, y: 0 },
    moved: false,
    pinching: false,
  });

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const clampScale = useCallback((value: number) => {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touches = e.touches;
      gestureRef.current.moved = false;

      if (touches.length === 2) {
        gestureRef.current.pinching = true;
        gestureRef.current.initialDistance = getTouchDistance(touches[0], touches[1]);
        gestureRef.current.initialScale = scaleRef.current;
        return;
      }

      if (touches.length === 1 && scaleRef.current > 1) {
        gestureRef.current.pinching = false;
        gestureRef.current.panStart = { x: touches[0].clientX, y: touches[0].clientY };
        gestureRef.current.offsetStart = { ...offsetRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 2) {
        e.preventDefault();
        gestureRef.current.moved = true;
        gestureRef.current.pinching = true;
        const distance = getTouchDistance(touches[0], touches[1]);
        const nextScale = clampScale(
          gestureRef.current.initialScale * (distance / gestureRef.current.initialDistance)
        );
        setScale(nextScale);
        if (nextScale <= 1) setOffset({ x: 0, y: 0 });
        return;
      }

      if (touches.length === 1 && scaleRef.current > 1) {
        e.preventDefault();
        gestureRef.current.moved = true;
        const dx = touches[0].clientX - gestureRef.current.panStart.x;
        const dy = touches[0].clientY - gestureRef.current.panStart.y;
        setOffset({
          x: gestureRef.current.offsetStart.x + dx,
          y: gestureRef.current.offsetStart.y + dy,
        });
      }
    };

    const handleTouchEnd = () => {
      if (scaleRef.current <= 1.02) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
      window.setTimeout(() => {
        gestureRef.current.pinching = false;
      }, 0);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [clampScale, isMobile, src]);

  const handleClick = () => {
    if (!isMobile) {
      onOpenLightbox?.();
      return;
    }
    if (gestureRef.current.moved || gestureRef.current.pinching || scaleRef.current > 1.05) {
      return;
    }
    onOpenLightbox?.();
  };

  if (!isMobile) {
    return (
      <button
        type="button"
        onClick={() => onOpenLightbox?.()}
        className={cn('block w-full overflow-hidden cursor-zoom-in text-left', className)}
        aria-label={`Hap: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block w-full h-auto"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn('relative w-full overflow-hidden touch-none select-none', className)}
      aria-label={`${alt}. Përdor dy gishta për zmadhim.`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block w-full h-auto origin-center will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
