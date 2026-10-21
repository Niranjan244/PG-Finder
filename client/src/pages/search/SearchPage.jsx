import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPGsApi } from '../../services/pgClient.js';
import { FilterSidebar } from '../../components/search/FilterSidebar.jsx';
import { PGCard } from '../../components/search/PGCard.jsx';
import { PGMap } from '../../components/search/PGMap.jsx';
import { LocationSearchBar } from '../../components/search/LocationSearchBar.jsx';
import {
  Building2,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Columns,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Navigation,
  Compass,
} from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract current query filters into an object
  const currentFilters = Object.fromEntries(searchParams.entries());

  // Determine if location coordinates are active
  const hasCoordinates = Boolean(currentFilters.lat && currentFilters.lng);
  const currentRadius = parseInt(currentFilters.radius, 10) || 10;

  const { data: searchResultsData, isLoading, isError, error } = useQuery({
    queryKey: ['searchPGs', searchParams.toString()],
    queryFn: () => searchPGsApi(currentFilters),
    staleTime: 30000,
  });

  const listings = searchResultsData?.data?.listings || [];
  const pagination = searchResultsData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };

  const handleFilterChange = (updatedPartial) => {
    const updated = { ...currentFilters, ...updatedPartial, page: 1 };
    // Strip empty keys
    Object.keys(updated).forEach((key) => {
      if (updated[key] === undefined || updated[key] === null || updated[key] === '') {
        delete updated[key];
      }
    });
    setSearchParams(updated);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handleLocationSelect = ({ lat, lng, userPlace, area, radius }) => {
    const updated = { ...currentFilters };
    delete updated.city;
    delete updated.area;
    delete updated.q;
    delete updated.keyword;
    delete updated.swLat;
    delete updated.swLng;
    delete updated.neLat;
    delete updated.neLng;

    updated.lat = lat;
    updated.lng = lng;
    updated.userPlace = userPlace || 'Selected Area';
    updated.radius = radius || 10;
    updated.sort = 'nearest';
    updated.page = 1;

    Object.keys(updated).forEach((key) => {
      if (updated[key] === undefined || updated[key] === null || updated[key] === '') {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  };

  const handleRadiusChange = (newRadius) => {
    handleFilterChange({ radius: newRadius });
  };

  const handleClearLocation = () => {
    const updated = { ...currentFilters, page: 1 };
    delete updated.lat;
    delete updated.lng;
    delete updated.radius;
    delete updated.userPlace;
    if (updated.sort === 'nearest') {
      delete updated.sort;
    }
    setSearchParams(updated);
  };

  const handleSearchInArea = (bounds) => {
    handleFilterChange({
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
    });
  };

  const handleSortChange = (event) => {
    handleFilterChange({ sort: event.target.value });
  };

  const handlePageChange = (newPage) => {
    handleFilterChange({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute next expanded radius option for the empty state
  const getNextExpandedRadius = () => {
    if (currentRadius < 2) return 5;
    if (currentRadius < 5) return 10;
    if (currentRadius < 10) return 20;
    return 50;
  };

  const userLocationObj = hasCoordinates
    ? {
        lat: parseFloat(currentFilters.lat),
        lng: parseFloat(currentFilters.lng),
        radiusKm: currentRadius,
        placeName: currentFilters.userPlace || 'Search Location',
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Search Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-theme-primary sm:text-2xl">
            Discover Verified PG Accommodations
          </h1>
          <p className="mt-0.5 text-xs text-theme-muted">
            {isLoading ? (
              'Searching accommodations...'
            ) : searchResultsData?.data?.nearMe?.isFallbackToNearest ? (
              `No accommodations found within ${currentRadius} km of ${
                currentFilters.userPlace || 'your location'
              } — showing closest verified accommodations on the platform`
            ) : hasCoordinates ? (
              `Found ${pagination.total} ${
                pagination.total === 1 ? 'accommodation' : 'accommodations'
              } within ${currentRadius} km of ${currentFilters.userPlace || 'your location'}`
            ) : (
              `Found ${pagination.total} verified ${
                pagination.total === 1 ? 'accommodation' : 'accommodations'
              }${currentFilters.city ? ` in ${currentFilters.city}` : ''}`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary shadow-xs transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-theme-brand" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-theme-secondary">
            <ArrowUpDown className="h-3.5 w-3.5 text-theme-muted" />
            <select
              value={currentFilters.sort || (hasCoordinates ? 'nearest' : 'newest')}
              onChange={handleSortChange}
              className="rounded-lg border border-theme-border bg-theme-surface py-1.5 px-2.5 text-xs font-semibold text-theme-primary shadow-xs focus:border-theme-brand focus:outline-none transition-colors"
            >
              {hasCoordinates && (
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
          </div>

          {/* Desktop View Switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-theme-surface-hover border border-theme-border p-1">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`rounded p-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-theme-surface shadow-xs text-theme-brand'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              title="Split View (List & Map)"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-theme-surface shadow-xs text-theme-brand'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              title="List View Only"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`rounded p-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-theme-surface shadow-xs text-theme-brand'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
              title="Map View Only"
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Near Me & Location Autocomplete Search Bar */}
      <LocationSearchBar
        currentFilters={currentFilters}
        onLocationSelect={handleLocationSelect}
        onRadiusChange={handleRadiusChange}
        onClearLocation={handleClearLocation}
      />

      {/* Main Content Layout */}
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <FilterSidebar
          filters={currentFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isOpenMobile={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />

        {/* Results Container */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-theme-muted">
                <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
                <span>Searching verified accommodations...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-theme-error/30 bg-theme-error-subtle p-8 text-center text-theme-error text-xs">
              <p className="font-semibold">Unable to fetch accommodations.</p>
              <p className="mt-1">{error?.message || 'Server error occurred'}</p>
            </div>
          ) : listings.length === 0 ? (
            /* Contextual Empty State */
            <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center transition-colors">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted">
                {hasCoordinates ? (
                  <Compass className="h-6 w-6 text-theme-brand" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-theme-primary">
                {hasCoordinates
                  ? `No PGs found within ${currentRadius} km`
                  : 'No Accommodations Found'}
              </h3>
              <p className="mt-1.5 text-xs text-theme-muted max-w-sm mx-auto">
                {hasCoordinates
                  ? `There are no verified accommodations within ${currentRadius} km of ${
                      currentFilters.userPlace || 'your selected location'
                    }. Try expanding your search radius to discover PGs in nearby localities.`
                  : 'No approved PGs matched your specific search filters. Try adjusting your budget, clearing locality constraints, or expanding the map area.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                {hasCoordinates && currentRadius < 50 && (
                  <button
                    type="button"
                    onClick={() => handleRadiusChange(getNextExpandedRadius())}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Expand Radius to {getNextExpandedRadius()} km</span>
                  </button>
                )}
                {hasCoordinates && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                  >
                    Clear Location Filter
                  </button>
                )}
                {!hasCoordinates && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Fallback to nearest notification banner */}
              {searchResultsData?.data?.nearMe?.isFallbackToNearest && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-theme-primary">
                        No accommodations found within {currentRadius} km of {currentFilters.userPlace || 'your location'}.
                      </span>
                      <p className="mt-0.5 text-theme-secondary">
                        Showing closest verified accommodations on the platform, sorted nearest first with distance badges:
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {currentRadius < 50 && (
                      <button
                        type="button"
                        onClick={() => handleRadiusChange(50)}
                        className="rounded-lg bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                      >
                        Expand to 50 km
                      </button>
                    )}
                    {currentRadius < 100 && (
                      <button
                        type="button"
                        onClick={() => handleRadiusChange(100)}
                        className="rounded-lg bg-amber-600 dark:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                      >
                        Expand to 100 km
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                    >
                      View All PGs
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic View rendering */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {listings.map((pg) => (
                    <PGCard key={pg._id} pg={pg} />
                  ))}
                </div>
              )}

              {viewMode === 'map' && (
                <div className="h-[75vh]">
                  <PGMap
                    listings={listings}
                    userLocation={userLocationObj}
                    onSearchInArea={handleSearchInArea}
                  />
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Left Column Cards */}
                  <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 order-2 xl:order-1">
                    {listings.map((pg) => (
                      <PGCard key={pg._id} pg={pg} />
                    ))}
                  </div>

                  {/* Right Column Sticky Map */}
                  <div className="xl:col-span-5 h-80 xl:h-[calc(100vh-10rem)] xl:sticky xl:top-24 order-1 xl:order-2">
                    <PGMap
                      listings={listings}
                      userLocation={userLocationObj}
                      onSearchInArea={handleSearchInArea}
                    />
                  </div>
                </div>
              )}

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-theme-border text-xs text-theme-secondary">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 font-medium hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 font-medium hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-50 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
