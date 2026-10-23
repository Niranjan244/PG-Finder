import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { geocodeLocationApi } from '../../services/pgClient.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

export const HeaderSearchBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSearchPage = location.pathname === '/search';
  const currentFilters = isSearchPage ? Object.fromEntries(searchParams.entries()) : {};

  const [query, setQuery] = useState(currentFilters.q || currentFilters.keyword || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { isLocating, getCurrentLocation, clearLocation: clearGeoHook } = useGeolocation();

  // Sync input value with URL query when on /search
  useEffect(() => {
    if (isSearchPage) {
      setQuery(currentFilters.q || currentFilters.keyword || '');
    }
  }, [currentFilters.q, currentFilters.keyword, isSearchPage]);

  // Close suggestions dropdown on outside click
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
        setSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  // Execute keyword search
  const executeSearch = (searchTerm) => {
    setIsDropdownOpen(false);
    const cleanTerm = (searchTerm || '').trim();

    if (isSearchPage) {
      const updated = { ...currentFilters, page: 1 };
      if (cleanTerm) {
        updated.q = cleanTerm;
      } else {
        delete updated.q;
        delete updated.keyword;
      }
      setSearchParams(updated);
    } else {
      if (cleanTerm) {
        navigate(`/search?q=${encodeURIComponent(cleanTerm)}`);
      } else {
        navigate('/search');
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    executeSearch(query);
  };

  // Select suggestion from autocomplete
  const handleSelectSuggestion = (item) => {
    setIsDropdownOpen(false);
    setQuery(item.name || item.displayName || '');

    const params = {
      lat: item.lat,
      lng: item.lng,
      userPlace: item.name || item.displayName,
      radius: currentFilters.radius || 10,
      sort: 'nearest',
      page: 1,
    };

    if (isSearchPage) {
      const updated = { ...currentFilters, ...params };
      delete updated.q;
      delete updated.keyword;
      delete updated.city;
      delete updated.area;
      setSearchParams(updated);
    } else {
      const queryStr = new URLSearchParams(params).toString();
      navigate(`/search?${queryStr}`);
    }
  };

  // GPS "Near me" handler
  const handleUseMyLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      const params = {
        lat: coords.latitude,
        lng: coords.longitude,
        userPlace: 'My Current Location',
        radius: 10,
        sort: 'nearest',
        page: 1,
      };

      setQuery('');
      if (isSearchPage) {
        const updated = { ...currentFilters, ...params };
        delete updated.q;
        delete updated.keyword;
        delete updated.city;
        delete updated.area;
        setSearchParams(updated);
      } else {
        const queryStr = new URLSearchParams(params).toString();
        navigate(`/search?${queryStr}`);
      }
    } catch (err) {
      console.warn('Geolocation failed:', err);
    }
  };

  // Clear search input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    if (isSearchPage) {
      const updated = { ...currentFilters, page: 1 };
      delete updated.q;
      delete updated.keyword;
      setSearchParams(updated);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="flex items-center w-full">
        {/* Search Input Bar */}
        <div className="relative flex items-center w-full rounded-full border border-theme-border bg-theme-surface hover:border-theme-border/80 focus-within:border-theme-brand focus-within:ring-2 focus-within:ring-theme-brand/20 shadow-xs transition-all">
          <button
            type="submit"
            className="pl-3.5 pr-1.5 text-theme-muted hover:text-theme-brand transition-colors cursor-pointer"
            title="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search for PG..."
            className="w-full bg-transparent py-2 sm:py-2.5 text-xs sm:text-sm text-theme-primary placeholder-theme-muted focus:outline-none"
          />

          <div className="pr-1.5 flex items-center gap-1 shrink-0">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-theme-muted hover:text-theme-primary p-1 rounded-full hover:bg-theme-surface-hover transition-colors"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {isSearchingSuggestions && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-brand mr-1" />
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-full bg-theme-brand px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-theme-brand-hover active:scale-95 transition-all cursor-pointer"
            >
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isDropdownOpen && (suggestions.length > 0 || isLocating) && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-theme-border bg-theme-surface shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="p-1.5 divide-y divide-theme-border/60">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex w-full items-center gap-2.5 p-2.5 text-left text-xs font-semibold text-theme-brand transition-colors rounded-xl hover:bg-theme-brand/10 cursor-pointer disabled:opacity-60"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-theme-brand" />
              ) : (
                <Navigation className="h-4 w-4 shrink-0 text-theme-brand" />
              )}
              <span>{isLocating ? 'Locating your position...' : 'Use my current location'}</span>
            </button>

            {suggestions.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-theme-muted">
                  Suggested Locations
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item.placeId || idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2.5 p-2.5 text-left text-xs transition-colors rounded-xl hover:bg-theme-surface-hover cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-theme-brand mt-0.5" />
                    <div>
                      <div className="font-semibold text-theme-primary">{item.name}</div>
                      <div className="text-[11px] text-theme-muted line-clamp-1">{item.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;
