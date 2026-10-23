import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';

export const DiscoverySubBar = ({ totalCount = 0, isLoading = false, onOpenMobileFilters }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilters = Object.fromEntries(searchParams.entries());

  const activeLat = currentFilters.lat ? parseFloat(currentFilters.lat) : null;
  const activeLng = currentFilters.lng ? parseFloat(currentFilters.lng) : null;
  const activeLocationLabel = currentFilters.userPlace || (activeLat && activeLng ? 'Your Location' : null);
  const activeSort = currentFilters.sort || (activeLat && activeLng ? 'nearest' : 'newest');

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

  const handleClearKeyword = () => {
    const updated = { ...currentFilters, page: 1 };
    delete updated.q;
    delete updated.keyword;
    setSearchParams(updated);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const updated = { ...currentFilters, sort: newSort, page: 1 };
    setSearchParams(updated);
  };

  return (
    <div className="border-t border-theme-border/70 bg-theme-surface/75 backdrop-blur-md transition-colors py-2 px-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto flex max-w-[1760px] w-full items-center justify-between gap-3 text-xs">
        {/* Left: Real-time Accommodations Counter + Active Filters */}
        <div className="flex flex-wrap items-center gap-2 text-theme-secondary">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-theme-primary">{isLoading ? '...' : totalCount}</span>
            <span>{totalCount === 1 ? 'accommodation found' : 'accommodations found'}</span>
          </div>

          {currentFilters.q && (
            <span className="inline-flex items-center gap-1 rounded-full bg-theme-brand/10 border border-theme-brand/30 px-2 py-0.5 text-[11px] font-semibold text-theme-brand">
              <span>&ldquo;{currentFilters.q}&rdquo;</span>
              <button
                type="button"
                onClick={handleClearKeyword}
                className="hover:text-theme-primary cursor-pointer p-0.5"
                title="Remove keyword filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeLocationLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-theme-surface border border-theme-border px-2 py-0.5 text-[11px] font-medium text-theme-secondary">
              <MapPin className="h-2.5 w-2.5 text-theme-brand" />
              <span>{activeLocationLabel}</span>
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

        {/* Right: Mobile Filter Drawer Trigger & Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Filter Trigger Button */}
          {onOpenMobileFilters && (
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary shadow-xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3 w-3 text-theme-brand" />
              <span>Filters</span>
            </button>
          )}

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={activeSort}
              onChange={handleSortChange}
              className="appearance-none rounded-lg border border-theme-border bg-theme-surface py-1 pl-6 pr-6 text-xs font-semibold text-theme-primary shadow-xs focus:border-theme-brand focus:outline-none transition-colors cursor-pointer hover:border-theme-border/80"
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
            <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-theme-muted pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverySubBar;
