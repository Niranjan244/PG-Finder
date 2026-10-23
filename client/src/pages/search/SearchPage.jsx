import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPGsApi } from '../../services/pgClient.js';
import { FilterSidebar } from '../../components/search/FilterSidebar.jsx';
import { PGCard } from '../../components/search/PGCard.jsx';
import {
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Compass,
  MapPin,
  ArrowUpDown,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { setSearchMeta } = useOutletContext() || {};

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

  // Sync pagination total and loading state with merged Header Discovery sub-bar
  useEffect(() => {
    if (setSearchMeta) {
      setSearchMeta({
        totalCount: pagination.total,
        isLoading,
        onOpenMobileFilters: () => setIsMobileFilterOpen(true),
      });
    }
  }, [pagination.total, isLoading, setSearchMeta]);

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
    <div className="mx-auto max-w-[1760px] w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5">
      {/* Main Content Layout */}
      <div className="flex items-start gap-6 lg:gap-8">
        {/* Filter Sidebar */}
        <FilterSidebar
          filters={currentFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isOpenMobile={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />

        {/* Results Container */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Results Summary Bar: Count & active filters on left, Sort on right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-theme-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-theme-secondary">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-theme-primary">{isLoading ? '...' : pagination.total}</span>
              <span>{pagination.total === 1 ? 'accommodation found' : 'accommodations found'}</span>

              {currentFilters.q && (
                <span className="inline-flex items-center gap-1 rounded-full bg-theme-brand/10 border border-theme-brand/30 px-2.5 py-0.5 text-[11px] font-semibold text-theme-brand">
                  <span>&ldquo;{currentFilters.q}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ q: '' })}
                    className="hover:text-theme-primary cursor-pointer p-0.5"
                    title="Remove keyword filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {currentFilters.userPlace && (
                <span className="inline-flex items-center gap-1 rounded-full bg-theme-surface border border-theme-border px-2.5 py-0.5 text-[11px] font-medium text-theme-secondary">
                  <MapPin className="h-3 w-3 text-theme-brand" />
                  <span>{currentFilters.userPlace}</span>
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="hover:text-theme-primary cursor-pointer p-0.5"
                    title="Remove location filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile Filter Trigger Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary shadow-xs transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-theme-brand" />
                <span>Filters</span>
              </button>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={currentFilters.sort || (hasCoordinates ? 'nearest' : 'newest')}
                  onChange={(e) => handleFilterChange({ sort: e.target.value })}
                  className="appearance-none rounded-lg border border-theme-border bg-theme-surface py-1.5 pl-7 pr-7 text-xs font-semibold text-theme-primary shadow-xs focus:border-theme-brand focus:outline-none transition-colors cursor-pointer hover:border-theme-border/80"
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
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-theme-muted pointer-events-none" />
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-xs text-theme-muted">
                <Loader2 className="h-8 w-8 animate-spin text-theme-brand" />
                <span className="font-medium">Searching verified accommodations...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-theme-error/30 bg-theme-error-subtle p-8 text-center text-theme-error text-xs">
              <p className="font-semibold text-sm">Unable to fetch accommodations.</p>
              <p className="mt-1">{error?.message || 'Server error occurred'}</p>
            </div>
          ) : listings.length === 0 ? (
            /* Contextual Empty State */
            <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center transition-colors">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-surface-hover text-theme-muted">
                {hasCoordinates ? (
                  <Compass className="h-7 w-7 text-theme-brand" />
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </div>
              <h3 className="mt-4 text-base font-bold text-theme-primary">
                {hasCoordinates
                  ? `No PGs found within ${currentRadius} km`
                  : 'No Accommodations Found'}
              </h3>
              <p className="mt-2 text-xs text-theme-muted max-w-md mx-auto leading-relaxed">
                {hasCoordinates
                  ? `There are no verified accommodations within ${currentRadius} km of ${
                      currentFilters.userPlace || 'your selected location'
                    }. Try expanding your search radius to discover PGs in nearby localities.`
                  : 'No approved PGs matched your specific search filters. Try adjusting your budget, clearing locality constraints, or expanding the map area.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasCoordinates && currentRadius < 50 && (
                  <button
                    type="button"
                    onClick={() => handleRadiusChange(getNextExpandedRadius())}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-theme-brand px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Expand Radius to {getNextExpandedRadius()} km</span>
                  </button>
                )}
                {hasCoordinates && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                  >
                    Clear Location Filter
                  </button>
                )}
                {!hasCoordinates && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-xl bg-theme-brand px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
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
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Compass className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-theme-primary">
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
                        className="rounded-xl bg-amber-600 dark:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                      >
                        Expand to 50 km
                      </button>
                    )}
                    {currentRadius < 100 && (
                      <button
                        type="button"
                        onClick={() => handleRadiusChange(100)}
                        className="rounded-xl bg-amber-600 dark:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                      >
                        Expand to 100 km
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="rounded-xl border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                    >
                      View All PGs
                    </button>
                  </div>
                </div>
              )}

              {/* Accommodations Grid (Clean full-width layout without right-column map) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {listings.map((pg) => (
                  <PGCard key={pg._id} pg={pg} />
                ))}
              </div>

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
                      className="inline-flex items-center gap-1 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-40 transition-colors shadow-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="inline-flex items-center gap-1 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-40 transition-colors shadow-xs"
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