import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Search,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  RotateCw,
  Compass,
  CheckCircle2,
  Crosshair,
} from 'lucide-react';
import { geocodeLocationApi, reverseGeocodeLocationApi } from '../../services/pgClient.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

export const POPULAR_AREAS = [
  { name: 'Rotary Nagar, Khammam', label: 'Rotary Nagar (Khammam)', lat: 17.2482, lng: 80.1745 },
  { name: 'Khammam', label: 'Khammam Center', lat: 17.2465, lng: 80.1500 },
  { name: 'Bengaluru', label: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', label: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
];

export const LocationSearchBar = ({
  currentFilters,
  onLocationSelect,
  onRadiusChange,
  onClearLocation,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [detectedAccuracyInfo, setDetectedAccuracyInfo] = useState(null);
  const dropdownRef = useRef(null);

  const {
    isLocating,
    error: geoError,
    errorCode,
    getCurrentLocation,
    clearLocation: clearGeoHook,
  } = useGeolocation();

  // Active coordinates in search filters
  const activeLat = currentFilters.lat ? parseFloat(currentFilters.lat) : null;
  const activeLng = currentFilters.lng ? parseFloat(currentFilters.lng) : null;
  const activeRadius = currentFilters.radius ? parseInt(currentFilters.radius, 10) : 10;
  const activeLocationLabel = currentFilters.userPlace || (activeLat && activeLng ? 'Your Location' : null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced geocoding query
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const res = await geocodeLocationApi(query.trim());
        const results = res?.data?.data?.suggestions || [];
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
      } catch (err) {
        console.error('Failed to geocode location:', err);
        setSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  // Handle "Use My Location" GPS click with reverse-geocoded place resolution
  const handleUseMyLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setQuery('');
      setIsDropdownOpen(false);

      if (coords.isApproximate) {
        setDetectedAccuracyInfo({
          isApproximate: true,
          accuracyKm: Math.round(coords.accuracy / 1000) || 5,
        });
      } else {
        setDetectedAccuracyInfo({
          isExact: true,
          accuracyMeters: coords.accuracy,
        });
      }

      let resolvedPlace = 'Current Location';
      try {
        setIsResolvingAddress(true);
        const revRes = await reverseGeocodeLocationApi(coords.lat, coords.lng);
        if (revRes?.data?.data?.placeName) {
          resolvedPlace = revRes.data.data.placeName;
        }
      } catch (revErr) {
        console.warn('Reverse geocode failed:', revErr);
      } finally {
        setIsResolvingAddress(false);
      }

      onLocationSelect({
        lat: coords.lat,
        lng: coords.lng,
        userPlace: resolvedPlace,
        radius: activeRadius,
      });
    } catch (err) {
      // Error is caught by hook and displayed in geoError banner
    }
  };

  // Handle selecting a geocoded suggestion
  const handleSelectSuggestion = (place) => {
    setQuery('');
    setIsDropdownOpen(false);
    setDetectedAccuracyInfo(null);
    onLocationSelect({
      lat: place.lat,
      lng: place.lng,
      userPlace: place.name || place.displayName.split(',')[0],
      radius: activeRadius,
    });
  };

  // Handle selecting a popular area pill
  const handleSelectArea = (area) => {
    setQuery('');
    setIsDropdownOpen(false);
    setDetectedAccuracyInfo({
      isExact: true,
      accuracyMeters: 50,
    });
    onLocationSelect({
      lat: area.lat,
      lng: area.lng,
      userPlace: area.label,
      radius: activeRadius,
    });
  };

  // Clear active location
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setDetectedAccuracyInfo(null);
    clearGeoHook();
    onClearLocation();
  };

  const isLocatingUser = isLocating || isResolvingAddress;

  return (
    <div className="w-full space-y-3">
      {/* Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        {/* Autocomplete Input */}
        <div className="relative flex-1" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsDropdownOpen(true);
              }}
              placeholder={
                activeLocationLabel
                  ? `Near: ${activeLocationLabel} (Search another area...)`
                  : 'Search landmark, college, or area (e.g. Rotary Nagar, Khammam, Koramangala)...'
              }
              className="w-full rounded-xl border border-theme-border bg-theme-surface py-2.5 pl-10 pr-10 text-xs text-theme-primary placeholder-theme-muted shadow-xs focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {isSearchingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-theme-brand" />
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-theme-border bg-theme-surface shadow-xl z-50 overflow-hidden">
              <div className="p-1.5 divide-y divide-theme-border/60">
                {suggestions.map((item, idx) => (
                  <button
                    key={item.placeId || idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2.5 p-2.5 text-left text-xs transition-colors rounded-lg hover:bg-theme-surface-hover"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-theme-brand mt-0.5" />
                    <div>
                      <div className="font-semibold text-theme-primary">{item.name}</div>
                      <div className="text-[11px] text-theme-muted line-clamp-1">
                        {item.displayName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* "Use My Location" Button with High Accuracy Detection */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocatingUser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs font-semibold text-theme-primary shadow-xs hover:bg-theme-surface-hover hover:border-theme-brand/60 focus:outline-none focus:ring-2 focus:ring-theme-brand transition-all disabled:opacity-60 shrink-0"
          title="Detect my exact current location via GPS/Wi-Fi"
        >
          {isLocatingUser ? (
            <Loader2 className="h-4 w-4 animate-spin text-theme-brand" />
          ) : (
            <Navigation className="h-4 w-4 text-theme-brand" />
          )}
          <span>
            {isLocating
              ? 'Locking exact GPS...'
              : isResolvingAddress
              ? 'Identifying locality...'
              : 'Use my location'}
          </span>
        </button>
      </div>

      {/* Quick Locality / City Shortcuts */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-theme-muted">
        <span className="text-[11px] font-medium text-theme-secondary">Quick areas:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {POPULAR_AREAS.map((area) => {
            const isSelected = activeLocationLabel?.toLowerCase().includes(area.name.toLowerCase());
            return (
              <button
                key={area.name}
                type="button"
                onClick={() => handleSelectArea(area)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                  isSelected
                    ? 'bg-theme-brand text-white border-theme-brand shadow-xs'
                    : 'bg-theme-surface text-theme-secondary border-theme-border hover:bg-theme-surface-hover hover:text-theme-primary'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>{area.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Accuracy GPS Fix Confirmation */}
      {detectedAccuracyInfo?.isExact && activeLat && activeLng && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">
              Exact location active: {activeLocationLabel}
              {detectedAccuracyInfo.accuracyMeters ? ` (±${detectedAccuracyInfo.accuracyMeters}m accuracy)` : ''}
            </span>
          </div>
          <span className="text-[10px] opacity-75 hidden sm:inline">Tip: You can also click on the map to pin a specific street</span>
        </div>
      )}

      {/* Approximate ISP / Network Geolocation Notice with 1-Click Exact Snapping */}
      {detectedAccuracyInfo?.isApproximate && activeLat && activeLng && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">Approximate location detected (~{detectedAccuracyInfo.accuracyKm} km)</span>
              <p className="mt-0.5 text-[11px] opacity-90">
                Laptop browsers without GPS estimate position from your network/ISP gateway. If you are in <strong>Khammam</strong>, tap below to snap to your exact locality or click on the map:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectArea(POPULAR_AREAS[0])}
              className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
            >
              <Crosshair className="h-3 w-3" />
              <span>Snap to Rotary Nagar, Khammam</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectArea(POPULAR_AREAS[1])}
              className="inline-flex items-center gap-1 rounded bg-theme-surface border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-colors"
            >
              <span>Khammam Center</span>
            </button>
          </div>
        </div>
      )}

      {/* Geolocation Permission or Network Error Banner */}
      {geoError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">{geoError}</span>
              {errorCode === 'PERMISSION_DENIED' && (
                <p className="mt-0.5 text-[11px] opacity-90">
                  Tip: Look for the location pin or lock icon in your browser address bar to allow location access, or select an area pill above.
                </p>
              )}
            </div>
          </div>
          {(errorCode === 'TIMEOUT' || errorCode === 'POSITION_UNAVAILABLE') && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-amber-700 shrink-0"
            >
              <RotateCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Active Near-Me Location Status & Radius Selector */}
      {activeLat && activeLng && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-surface-subtle p-3 transition-colors">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-primary">
                  Searching near {activeLocationLabel || 'Selected Location'}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded p-0.5 text-theme-muted hover:text-rose-500 hover:bg-theme-surface-hover transition-colors"
                  title="Clear location filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-theme-muted">
                Showing verified PGs within {activeRadius} km &bull; Sorted nearest first
              </div>
            </div>
          </div>

          {/* Radius Selector Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-theme-secondary mr-1">Radius:</span>
            <div className="flex items-center rounded-lg border border-theme-border bg-theme-surface p-1">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRadiusChange(r)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    activeRadius === r
                      ? 'bg-theme-brand text-white shadow-xs'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;
