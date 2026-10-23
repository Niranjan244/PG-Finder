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
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { geocodeLocationApi, reverseGeocodeLocationApi } from '../../services/pgClient.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];

export const POPULAR_AREAS = [
  { name: 'Rotary Nagar, Khammam', label: 'Rotary Nagar', lat: 17.2482, lng: 80.1745 },
  { name: 'Khammam', label: 'Khammam', lat: 17.2465, lng: 80.1500 },
  { name: 'Bengaluru', label: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', label: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
];

export const LocationSearchBar = ({
  currentFilters = {},
  totalCount = 0,
  isLoading = false,
  sort = 'newest',
  onSortChange,
  onOpenMobileFilters,
  onKeywordSearch,
  onLocationSelect,
  onRadiusChange,
  onClearLocation,
}) => {
  const [query, setQuery] = useState(currentFilters.q || currentFilters.keyword || '');
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

  // Sync external filter changes (e.g. from reset filters or sidebar) with query state
  useEffect(() => {
    const currentQ = currentFilters.q || currentFilters.keyword || '';
    setQuery(currentQ);
  }, [currentFilters.q, currentFilters.keyword]);

  // Debounce typing to automatically trigger keyword search on listings
  useEffect(() => {
    const currentQ = (currentFilters.q || currentFilters.keyword || '').trim();
    if (query.trim() === currentQ) return;

    const timer = setTimeout(() => {
      if (onKeywordSearch) {
        onKeywordSearch(query.trim());
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query, currentFilters.q, currentFilters.keyword, onKeywordSearch]);

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

  // Debounced geocoding query for area suggestions
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

  // Explicit form submit on Enter or Search button click
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    if (onKeywordSearch) {
      onKeywordSearch(query.trim());
    }
  };

  // Handle "Use My Location" GPS click
  const handleUseMyLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setQuery('');
      setIsDropdownOpen(false);

      setDetectedAccuracyInfo({
        isExact: true,
        accuracyMeters: coords.accuracy || 25,
      });

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

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'preferred_exact_location',
          JSON.stringify({ lat: coords.lat, lng: coords.lng, userPlace: resolvedPlace })
        );
      }

      onLocationSelect({
        lat: coords.lat,
        lng: coords.lng,
        userPlace: resolvedPlace,
        radius: activeRadius,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  // Handle selecting a geocoded suggestion
  const handleSelectSuggestion = (place) => {
    setQuery('');
    setIsDropdownOpen(false);
    setDetectedAccuracyInfo(null);
    const placeName = place.name || place.displayName.split(',')[0];

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'preferred_exact_location',
        JSON.stringify({ lat: place.lat, lng: place.lng, userPlace: placeName })
      );
    }

    if (onKeywordSearch) {
      onKeywordSearch('');
    }

    onLocationSelect({
      lat: place.lat,
      lng: place.lng,
      userPlace: placeName,
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

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'preferred_exact_location',
        JSON.stringify({ lat: area.lat, lng: area.lng, userPlace: area.label })
      );
    }

    if (onKeywordSearch) {
      onKeywordSearch('');
    }

    onLocationSelect({
      lat: area.lat,
      lng: area.lng,
      userPlace: area.label,
      radius: activeRadius,
    });
  };

  // Clear active location and keyword search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setDetectedAccuracyInfo(null);
    clearGeoHook();
    if (onKeywordSearch) {
      onKeywordSearch('');
    }
    onClearLocation();
  };

  const isLocatingUser = isLocating || isResolvingAddress;

  return (
    <div className="w-full rounded-2xl border border-theme-border bg-theme-surface/95 backdrop-blur-md p-3 sm:p-3.5 shadow-xs space-y-2.5 transition-colors">
      {/* Top Row: Search Form + Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1" ref={dropdownRef}>
          <div className="relative flex items-center">
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-brand transition-colors p-0.5"
              title="Click or press Enter to search"
            >
              <Search className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsDropdownOpen(true);
              }}
              placeholder={
                activeLocationLabel
                  ? `Search PG name or landmark in ${activeLocationLabel}...`
                  : 'Search for PG...'
              }
              className="w-full rounded-xl border border-theme-border bg-theme-surface py-2 pl-9 pr-24 text-xs text-theme-primary placeholder-theme-muted shadow-xs focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    if (onKeywordSearch) onKeywordSearch('');
                  }}
                  className="text-theme-muted hover:text-theme-primary p-1 rounded-md hover:bg-theme-surface-hover transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {isSearchingSuggestions && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-brand mr-0.5" />
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-theme-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors cursor-pointer"
              >
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-theme-border bg-theme-surface shadow-xl z-50 overflow-hidden">
              <div className="p-1.5 divide-y divide-theme-border/60">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase text-theme-muted">
                  Suggested Locations
                </div>
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
        </form>

        {/* Right Controls: Near Me, Mobile Filters, Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* "Near Me" GPS Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocatingUser}
            className="inline-flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-primary shadow-xs hover:bg-theme-surface-hover hover:border-theme-brand/60 focus:outline-none transition-all disabled:opacity-60 cursor-pointer"
            title="Detect my current location"
          >
            {isLocatingUser ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-brand" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-theme-brand" />
            )}
            <span className="hidden md:inline">
              {isLocating ? 'Locating...' : 'Near me'}
            </span>
          </button>

          {/* Mobile Filter Trigger */}
          {onOpenMobileFilters && (
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary shadow-xs transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-theme-brand" />
              <span>Filters</span>
            </button>
          )}

          {/* Sort Selector */}
          {onSortChange && (
            <div className="relative">
              <select
                value={sort}
                onChange={onSortChange}
                className="appearance-none rounded-xl border border-theme-border bg-theme-surface py-2 pl-7 pr-7 text-xs font-semibold text-theme-primary shadow-xs focus:border-theme-brand focus:outline-none transition-colors cursor-pointer hover:border-theme-border/80"
              >
                {activeLat && activeLng && (
                  <option value="nearest" className="bg-theme-surface text-theme-primary">
                    Nearest First
                  </option>
                )}
                <option value="newest" className="bg-theme-surface text-theme-primary">
                  Newest Listed
                </option>
                <option value="rent_asc" className="bg-theme-surface text-theme-primary">
                  Rent: Low to High
                </option>
                <option value="rent_desc" className="bg-theme-surface text-theme-primary">
                  Rent: High to Low
                </option>
                <option value="rating_desc" className="bg-theme-surface text-theme-primary">
                  Top Rated
                </option>
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-theme-muted pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sub-Row: Results Count on Left + Quick Area Shortcuts on Right */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-theme-border/60 text-xs">
        {/* Live Results Count with pulsing indicator */}
        <div className="flex items-center gap-2 text-theme-secondary">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-bold text-theme-primary">{totalCount}</span>
          <span>{totalCount === 1 ? 'accommodation found' : 'accommodations found'}</span>
          {currentFilters.q && (
            <span className="text-theme-muted">
              matching &ldquo;<span className="font-semibold text-theme-brand">{currentFilters.q}</span>&rdquo;
            </span>
          )}
          {activeLocationLabel && (
            <span className="text-theme-muted hidden sm:inline">
              &bull; near <span className="font-semibold text-theme-primary">{activeLocationLabel}</span>
            </span>
          )}
        </div>

        {/* Quick Area Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-theme-muted hidden md:inline">Quick:</span>
          {POPULAR_AREAS.map((area) => {
            const isSelected = activeLocationLabel?.toLowerCase().includes(area.name.toLowerCase());
            return (
              <button
                key={area.name}
                type="button"
                onClick={() => handleSelectArea(area)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-all ${
                  isSelected
                    ? 'bg-theme-brand text-white border-theme-brand shadow-xs'
                    : 'bg-theme-surface text-theme-secondary border-theme-border hover:bg-theme-surface-hover hover:text-theme-primary'
                }`}
              >
                <MapPin className="h-2.5 w-2.5" />
                <span>{area.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Near-Me Location Status & Radius Selector */}
      {activeLat && activeLng && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-theme-surface-subtle border border-theme-border/60 p-2 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-theme-brand shrink-0" />
            <span className="font-semibold text-theme-primary">
              Searching within {activeRadius} km of {activeLocationLabel}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-theme-muted hover:text-rose-500 p-0.5 rounded transition-colors"
              title="Clear location filter"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-theme-muted mr-1 hidden sm:inline">Radius:</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRadiusChange(r)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all ${
                  activeRadius === r
                    ? 'bg-theme-brand text-white shadow-xs'
                    : 'text-theme-secondary hover:text-theme-primary bg-theme-surface border border-theme-border'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geolocation Permission or Network Error Banner */}
      {geoError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">{geoError}</span>
              {errorCode === 'PERMISSION_DENIED' && (
                <p className="mt-0.5 text-[11px] opacity-90">
                  Tip: Look for the location lock icon in your browser address bar to allow location access, or click a quick area shortcut above.
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
    </div>
  );
};

export default LocationSearchBar;