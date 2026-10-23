import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Navigation, ExternalLink, Building2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

const createPGPin = (isDark) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#026fc7" filter="url(#shadow)"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: svgString,
    className: 'custom-pg-map-pin',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

export const PGDetailMap = ({ pg, isOpen, onClose }) => {
  const { isDark } = useTheme();

  if (!isOpen || !pg) return null;

  const coords = pg.location?.coordinates;
  const hasCoords = coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);

  // Coordinates in GeoJSON are [lng, lat], Leaflet uses [lat, lng]
  const lat = hasCoords ? coords[1] : 12.9716;
  const lng = hasCoords ? coords[0] : 77.5946;

  const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-theme-border bg-theme-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-theme-border bg-theme-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand/10 text-theme-brand border border-theme-brand/20">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-theme-primary">{pg.title}</h3>
              <p className="text-xs text-theme-muted line-clamp-1">
                {pg.address}, {pg.area}, {pg.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Get Directions</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Map Body */}
        <div className="relative h-[480px] sm:h-[520px] w-full">
          {hasCoords ? (
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution={tileAttribution}
                url={tileLayerUrl}
              />
              <Marker position={[lat, lng]} icon={createPGPin(isDark)}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-theme-primary">{pg.title}</p>
                    <p className="text-theme-muted">{pg.area}, {pg.city}</p>
                    <p className="mt-1 font-semibold text-theme-brand">
                      ₹{pg.rentRange?.minRent?.toLocaleString()} / mo
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 text-theme-muted">
              <Building2 className="h-10 w-10 mb-2" />
              <p className="text-sm font-semibold text-theme-primary">Exact GPS coordinates not available</p>
              <p className="text-xs text-theme-muted mt-1">{pg.address}, {pg.area}, {pg.city}</p>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="p-3 sm:p-4 bg-theme-surface-subtle border-t border-theme-border flex items-center justify-between text-xs text-theme-muted">
          <span>Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
          <span className="hidden sm:inline">Use scroll wheel to zoom or drag to explore neighborhood streets</span>
        </div>
      </div>
    </div>
  );
};

export default PGDetailMap;