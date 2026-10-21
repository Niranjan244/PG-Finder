import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Navigation } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

// Clickable popup card for accommodations with guaranteed event handling inside Leaflet
const MapPopupCard = ({ pg }) => {
  const navigate = useNavigate();
  const cardRef = React.useRef(null);
  const btnRef = React.useRef(null);

  React.useEffect(() => {
    const handleNavigate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const search = typeof window !== 'undefined' ? window.location.search : '';
      navigate(`/pg/${pg._id}${search}`);
    };

    const card = cardRef.current;
    const btn = btnRef.current;

    if (card) {
      card.addEventListener('click', handleNavigate);
    }
    if (btn) {
      btn.addEventListener('click', handleNavigate);
    }

    return () => {
      if (card) card.removeEventListener('click', handleNavigate);
      if (btn) btn.removeEventListener('click', handleNavigate);
    };
  }, [pg._id, navigate]);

  return (
    <div className="w-52 p-1 text-theme-primary">
      <div
        ref={cardRef}
        className="cursor-pointer group/popup"
        role="button"
        tabIndex={0}
      >
        <div className="h-24 w-full overflow-hidden rounded-lg bg-theme-surface-hover relative">
          {pg.images?.[0]?.url ? (
            <img
              src={pg.images[0].url}
              alt={pg.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover/popup:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-theme-muted">
              <Building2 className="h-6 w-6" />
            </div>
          )}
        </div>
        <h4 className="mt-2 text-xs font-bold text-theme-primary line-clamp-1 group-hover/popup:text-theme-brand transition-colors">
          {pg.title}
        </h4>
        <div className="text-[11px] text-theme-muted line-clamp-1">
          {pg.area}, {pg.city}
          {pg.distanceKm !== undefined && pg.distanceKm !== null && (
            <span className="font-semibold text-theme-brand ml-1">
              &bull;{' '}
              {pg.distanceKm < 1
                ? `${Math.round(pg.distanceMeters || pg.distanceKm * 1000)} m`
                : `${pg.distanceKm} km`}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-theme-border/60 flex items-center justify-between text-[11px]">
        <span className="font-bold text-theme-brand">
          ₹{pg.rentRange?.minRent?.toLocaleString() || 0}
          <span className="text-[10px] font-normal text-theme-muted"> / mo</span>
        </span>
        <button
          ref={btnRef}
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-theme-brand px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-theme-brand-hover active:scale-95 transition-all cursor-pointer"
        >
          <span>Details</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};

// Custom SVG map marker icon for PGs
const createCustomMarker = (gender = 'coliving', isDark = false) => {
  const colorMap = {
    boys: '#0284c7', // sky-600
    girls: '#e11d48', // rose-600
    coliving: '#8b5cf6', // violet-500
  };

  const color = colorMap[gender] || '#0284c7';
  const strokeColor = isDark ? '#0f172a' : '#ffffff';
  const circleColor = isDark ? '#1e293b' : '#ffffff';

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="${circleColor}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgString,
    className: 'custom-map-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
};

// Distinct User Position Marker with animated radar pulse
const createUserMarker = () => {
  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(2, 111, 199, 0.35); animation: leaflet-radar 2s infinite ease-out;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #026fc7; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'user-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Child component listening to map movements
const MapEventsHandler = ({ onBoundsChanged }) => {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChanged({
        swLat: bounds.getSouth(),
        swLng: bounds.getWest(),
        neLat: bounds.getNorth(),
        neLng: bounds.getEast(),
      });
    },
  });
  return null;
};

// Child component to auto-pan and zoom when user location or radius changes
const MapRecenterHandler = ({ userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      const radiusKm = userLocation.radiusKm || 10;
      // Appropriate zoom levels for radius ranges
      let zoom = 14;
      if (radiusKm <= 2) zoom = 14;
      else if (radiusKm <= 5) zoom = 13;
      else if (radiusKm <= 10) zoom = 12;
      else zoom = 11;

      map.setView([userLocation.lat, userLocation.lng], zoom, {
        animate: true,
      });
    }
  }, [userLocation?.lat, userLocation?.lng, userLocation?.radiusKm, map]);

  return null;
};

export const PGMap = ({ listings = [], userLocation = null, onSearchInArea }) => {
  const { isDark } = useTheme();
  const [pendingBounds, setPendingBounds] = useState(null);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);

  // Compute map center from user location, first listing, or Bangalore default
  const defaultCenter = [12.9716, 77.5946];
  const center =
    userLocation?.lat && userLocation?.lng
      ? [userLocation.lat, userLocation.lng]
      : listings.length > 0 && listings[0].location?.coordinates?.length === 2
      ? [listings[0].location.coordinates[1], listings[0].location.coordinates[0]]
      : defaultCenter;

  const handleBoundsChanged = (bounds) => {
    setPendingBounds(bounds);
    setShowSearchAreaBtn(true);
  };

  const triggerAreaSearch = () => {
    if (pendingBounds) {
      onSearchInArea(pendingBounds);
      setShowSearchAreaBtn(false);
    }
  };

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  const radiusInMeters = userLocation?.radiusKm ? userLocation.radiusKm * 1000 : 10000;

  return (
    <div className="relative h-full w-full min-h-[480px] rounded-2xl overflow-hidden border border-theme-border shadow-xs transition-colors">
      {/* Floating 'Search this area' button */}
      {showSearchAreaBtn && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            type="button"
            onClick={triggerAreaSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-theme-surface/90 text-theme-primary border border-theme-border px-4 py-2 text-xs font-semibold shadow-lg hover:bg-theme-surface hover:scale-105 backdrop-blur-xs transition-all"
          >
            <Search className="h-3.5 w-3.5 text-theme-brand" />
            <span>Search in this area</span>
          </button>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={userLocation ? 13 : 13}
        scrollWheelZoom={true}
        closePopupOnClick={false}
        className="h-full w-full"
      >
        <TileLayer
          key={isDark ? 'dark-tiles' : 'light-tiles'}
          attribution={tileAttribution}
          url={tileUrl}
        />

        <MapEventsHandler onBoundsChanged={handleBoundsChanged} />
        {userLocation && <MapRecenterHandler userLocation={userLocation} />}

        {/* User Search Center Marker & Radius Circle */}
        {userLocation?.lat && userLocation?.lng && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserMarker()}
            >
              <Popup className="pg-map-popup">
                <div className="p-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-theme-brand">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Search Center</span>
                  </div>
                  <p className="mt-1 text-[11px] text-theme-secondary">
                    {userLocation.placeName || 'Your Location'}
                  </p>
                  <p className="text-[10px] text-theme-muted">
                    Radius: {userLocation.radiusKm || 10} km
                  </p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusInMeters}
              pathOptions={{
                color: isDark ? '#38a8f8' : '#026fc7',
                fillColor: isDark ? '#38a8f8' : '#026fc7',
                fillOpacity: isDark ? 0.12 : 0.08,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
          </>
        )}

        {/* Accommodation Markers */}
        {listings.map((pg) => {
          const coords = pg.location?.coordinates;
          if (!coords || coords.length !== 2) return null;
          const lat = coords[1];
          const lng = coords[0];

          return (
            <Marker
              key={pg._id}
              position={[lat, lng]}
              icon={createCustomMarker(pg.genderPreference, isDark)}
            >
              <Popup className="pg-map-popup" closeButton={true}>
                <MapPopupCard pg={pg} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PGMap;
