import { CITY_COORDINATES, DEFAULT_MAP_CENTER } from '@/lib/constants';

export const PRECISE_MAP_ZOOM = 18;
export const DETAIL_MAP_ZOOM = 17;

export function getCityCenter(city?: string): [number, number] {
  if (city && CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  return DEFAULT_MAP_CENTER;
}

/** Haversine distance in km between two lat/lng points */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatCoordinates(lat: number, lng: number, precision = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}
