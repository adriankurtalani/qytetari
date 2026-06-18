'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, AlertCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createPreciseMarkerIcon } from '@/lib/map-leaflet';
import {
  formatCoordinates,
  getCityCenter,
  distanceKm,
  PRECISE_MAP_ZOOM,
} from '@/lib/map-utils';
import type { LocationValue } from '@/lib/location-types';

export type { LocationValue };

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (location: LocationValue) => void;
  city?: string;
}

const MAX_ACCURACY_METERS = 1500;
const MAX_CITY_DISTANCE_KM = 35;

export function LocationPicker({ value, onChange, city }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [address, setAddress] = useState('');

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'sq,en' } }
      );
      if (res.ok) {
        const data = await res.json();
        setAddress(data.display_name || '');
      }
    } catch {
      setAddress('');
    }
  }

  function clearWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function validateAgainstCity(lat: number, lng: number): string {
    if (!city) return '';
    const [cityLat, cityLng] = getCityCenter(city);
    const km = distanceKm(lat, lng, cityLat, cityLng);
    if (km > MAX_CITY_DISTANCE_KM) {
      return `GPS tregoi një vend jashtë ${city} (~${Math.round(km)} km). Tërhiqeni pin-in në lokacionin e saktë.`;
    }
    return '';
  }

  function applyLocation(location: LocationValue) {
    onChange(location);
    reverseGeocode(location.lat, location.lng);
    const warn = validateAgainstCity(location.lat, location.lng);
    setWarning(warn);
  }

  function placeMarker(map: L.Map, location: LocationValue) {
    const position: L.LatLngExpression = [location.lat, location.lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      const marker = L.marker(position, {
        icon: createPreciseMarkerIcon('#dc2626'),
        draggable: true,
        autoPan: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        applyLocation({ lat: latlng.lat, lng: latlng.lng, accuracy: location.accuracy });
      });

      markerRef.current = marker;
    }

    if (accuracyRef.current) {
      accuracyRef.current.remove();
      accuracyRef.current = null;
    }

    if (location.accuracy && location.accuracy > 0 && location.accuracy < MAX_ACCURACY_METERS) {
      accuracyRef.current = L.circle(position, {
        radius: location.accuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }

    map.setView(position, PRECISE_MAP_ZOOM);
  }

  useEffect(() => {
    if (!value || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([value.lat, value.lng], PRECISE_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      const loc: LocationValue = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        accuracy: value.accuracy,
      };
      applyLocation(loc);
      placeMarker(map, loc);
    });

    mapInstanceRef.current = map;
    placeMarker(map, value);
    reverseGeocode(value.lat, value.lng);

    return () => {
      clearWatch();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      accuracyRef.current = null;
    };
  }, [!!value]);

  useEffect(() => {
    if (value && mapInstanceRef.current) {
      placeMarker(mapInstanceRef.current, value);
    }
  }, [value?.lat, value?.lng]);

  function openManualPlacement() {
    if (!city) {
      setError('Zgjidhni qytetin fillimisht, pastaj vendosni lokacionin në hartë.');
      return;
    }
    setError('');
    setWarning('');
    const [lat, lng] = getCityCenter(city);
    applyLocation({ lat, lng });
  }

  function captureLocation() {
    if (!city) {
      setError('Zgjidhni qytetin fillimisht — harta do të hapet në qytetin tuaj, jo në Prishtinë.');
      return;
    }

    setError('');
    setWarning('');
    setLoading(true);
    clearWatch();

    const [cityLat, cityLng] = getCityCenter(city);

    // Open map immediately at selected city while GPS refines
    applyLocation({ lat: cityLat, lng: cityLng });

    if (!navigator.geolocation) {
      setWarning('GPS nuk mbështetet. Tërhiqeni pin-in në lokacionin e saktë në hartë.');
      setLoading(false);
      return;
    }

    let best: GeolocationPosition | null = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
        }

        // Only apply GPS when accuracy is good enough (not IP-based ~city level)
        if (pos.coords.accuracy <= MAX_ACCURACY_METERS) {
          applyLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        }
      },
      () => {
        clearWatch();
        setWarning(
          `GPS nuk u aktivizua. Pin-i është në qendër të ${city} — tërhiqeni në lokacionin e saktë.`
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );

    setTimeout(() => {
      clearWatch();
      setLoading(false);

      if (best && best.coords.accuracy <= MAX_ACCURACY_METERS) {
        applyLocation({
          lat: best.coords.latitude,
          lng: best.coords.longitude,
          accuracy: best.coords.accuracy,
        });
      } else if (best && best.coords.accuracy > MAX_ACCURACY_METERS) {
        setWarning(
          `GPS i paqartë (±${Math.round(best.coords.accuracy)}m). Pin-i mbeti në ${city} — tërhiqeni manualisht në vendin e saktë.`
        );
      }
    }, 10000);
  }

  return (
    <div className="space-y-3">
      {!city && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Zgjidhni qytetin më sipër para se të kapni lokacionin.
        </p>
      )}

      {!value ? (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={captureLocation}
            loading={loading}
            disabled={!city}
            className="gap-2 w-full sm:w-auto min-h-[44px]"
          >
            <MapPin className="h-4 w-4" />
            Kap Lokacionin e Saktë
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={openManualPlacement}
            disabled={!city}
            className="gap-2 w-full sm:w-auto min-h-[44px]"
          >
            <Map className="h-4 w-4" />
            Vendos Manualisht në Hartë
          </Button>
          {error && (
            <p className="w-full text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
          <p className="w-full text-xs text-gray-500">
            Harta hapet në qytetin që zgjidhni ({city || '...'}). GPS mund të jetë i pasaktë në
            kompjuter — gjithmonë mund ta tërhiqni pin-in në vendin e saktë.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Lokacioni u vendos {city ? `· ${city}` : ''}
                </p>
                <p className="text-xs mt-1 font-mono">
                  {formatCoordinates(value.lat, value.lng)}
                </p>
                {value.accuracy && value.accuracy < MAX_ACCURACY_METERS && (
                  <p className="text-xs mt-1 text-green-700">
                    Saktësia GPS: ±{Math.round(value.accuracy)}m
                  </p>
                )}
                {address && (
                  <p className="text-xs mt-1 text-green-700 line-clamp-2">{address}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={captureLocation}
                loading={loading}
                className="gap-1 shrink-0 self-start sm:self-auto min-h-[40px]"
              >
                <Crosshair className="h-3 w-3" />
                Rivendos GPS
              </Button>
            </div>
          </div>

          {warning && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {warning}
            </p>
          )}

          <div className="relative">
            <div ref={mapRef} className="h-56 sm:h-72 w-full rounded-xl border border-gray-200 z-0" />
            <p className="absolute bottom-2 left-2 right-2 z-[1000] rounded bg-white/90 px-2 py-1.5 text-[11px] sm:text-xs text-gray-600 text-center shadow leading-snug">
              Tërhiqni pin-in ose klikoni në hartë për lokacionin e saktë të biznesit
            </p>
          </div>
        </>
      )}
    </div>
  );
}
