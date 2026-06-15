'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface SiteLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gradient' | 'plain';
  className?: string;
  showImage?: boolean;
}

const sizeMap = {
  sm: { box: 'h-9 w-9', text: 'text-sm', image: 36 },
  md: { box: 'h-10 w-10', text: 'text-sm', image: 40 },
  lg: { box: 'h-12 w-12', text: 'text-lg', image: 48 },
};

export function SiteLogo({
  size = 'md',
  variant = 'gradient',
  className,
  showImage = true,
}: SiteLogoProps) {
  const settings = useSiteSettings();
  const s = sizeMap[size];

  if (showImage && settings.logo_url) {
    return (
      <div
        className={cn(
          s.box,
          'relative shrink-0 overflow-hidden rounded-xl shadow-md',
          className
        )}
      >
        <Image
          src={settings.logo_url}
          alt={settings.platform_name}
          fill
          className="object-cover"
          sizes={`${s.image}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        s.box,
        'flex shrink-0 items-center justify-center rounded-xl font-bold shadow-md',
        variant === 'gradient' ? 'hero-gradient text-white' : 'bg-slate-100 text-slate-700',
        s.text,
        className
      )}
    >
      {settings.logo_abbr}
    </div>
  );
}
