'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import { createReportMarkerIcon, formatCoordinates } from '@/lib/map-utils';
import type { Report, Category } from '@/lib/types';

interface ReportsMapProps {
  reports: Report[];
  categories: Category[];
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  onReportClick?: (reportId: string) => void;
}

export function ReportsMap({
  reports,
  categories,
  selectedCategory,
  onCategoryChange,
  onReportClick,
}: ReportsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const cluster = L.markerClusterGroup();
    map.addLayer(cluster);

    mapInstanceRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!clusterRef.current) return;

    clusterRef.current.clearLayers();

    const filtered = selectedCategory
      ? reports.filter((r) => r.category?.slug === selectedCategory)
      : reports;

    const icon = createReportMarkerIcon();

    filtered.forEach((report) => {
      const marker = L.marker([report.latitude, report.longitude], { icon });
      marker.bindPopup(`
        <div style="min-width:200px">
          <strong>${report.title}</strong>
          <p style="margin:4px 0;font-size:11px;color:#666;font-family:monospace">
            ${formatCoordinates(report.latitude, report.longitude, 5)}
          </p>
          <p style="margin:4px 0;font-size:12px;color:#666">${report.city}</p>
          <p style="margin:4px 0;font-size:12px">${report.description.substring(0, 100)}...</p>
          <a href="/reports/${report.id}" style="color:#2563eb;font-size:12px">Shiko detajet →</a>
        </div>
      `);
      marker.on('click', () => onReportClick?.(report.id));
      clusterRef.current!.addLayer(marker);
    });
  }, [reports, selectedCategory, onReportClick]);

  return (
    <div className="relative h-full w-full">
      {onCategoryChange && (
        <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-[1000]">
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full sm:w-auto text-base sm:text-sm border border-gray-200 rounded-lg px-3 py-2.5 sm:px-2 sm:py-1 bg-white shadow-lg min-h-[44px] sm:min-h-0"
          >
            <option value="">Të gjitha kategoritë</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full rounded-xl" />
    </div>
  );
}
