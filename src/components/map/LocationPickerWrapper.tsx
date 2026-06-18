'use client';

import dynamic from 'next/dynamic';
import type { LocationValue } from '@/lib/location-types';

export type { LocationValue };

const LocationPicker = dynamic(
  () => import('./LocationPicker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 w-full rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
    ),
  }
);

interface LocationPickerWrapperProps {
  value: LocationValue | null;
  onChange: (location: LocationValue) => void;
  city?: string;
}

export function LocationPickerWrapper(props: LocationPickerWrapperProps) {
  return <LocationPicker {...props} />;
}
