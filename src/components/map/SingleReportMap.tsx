'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createPreciseMarkerIcon,
  formatCoordinates,
  DETAIL_MAP_ZOOM,
} from '@/lib/map-utils';

interface SingleReportMapProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export default function SingleReportMap({ latitude, longitude, title }: SingleReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [latitude, longitude],
      DETAIL_MAP_ZOOM
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: createPreciseMarkerIcon('#dc2626'),
    }).addTo(map);

    marker.bindPopup(`
      <div style="min-width:180px;text-align:center">
        <strong style="font-size:13px">${title || 'Lokacioni i raportimit'}</strong>
        <p style="margin:6px 0 0;font-size:11px;color:#666;font-family:monospace">
          ${formatCoordinates(latitude, longitude)}
        </p>
      </div>
    `).openPopup();

    return () => {
      map.remove();
    };
  }, [latitude, longitude, title]);

  return (
    <div>
      <div ref={mapRef} className="h-80 w-full rounded-xl border border-gray-200" />
      <p className="mt-2 text-xs text-gray-500 font-mono text-center">
        {formatCoordinates(latitude, longitude)}
      </p>
    </div>
  );
}
