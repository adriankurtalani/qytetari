import L from 'leaflet';

export function createPreciseMarkerIcon(color = '#dc2626'): L.DivIcon {
  return L.divIcon({
    className: 'precise-marker',
    html: `
      <div class="precise-marker-pin" style="--pin-color:${color}">
        <span class="precise-marker-dot"></span>
        <span class="precise-marker-pulse"></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}
