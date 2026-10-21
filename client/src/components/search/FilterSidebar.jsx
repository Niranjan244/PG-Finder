import React from 'react';
import { Search, RotateCcw, SlidersHorizontal, X } from 'lucide-react';

const AMENITY_OPTIONS = [
  'Air Conditioning',
  'High-Speed Wi-Fi',
  'Power Backup',
  'RO Drinking Water',
  'Washing Machine',
  'Geyser / Hot Water',
  'CCTV Surveillance',
  'Daily Housekeeping',
];

const ROOM_TYPE_OPTIONS = [
  { id: 'single', label: 'Single Occupancy' },
  { id: 'double', label: 'Double Sharing' },
  { id: 'triple', label: 'Triple Sharing' },
  { id: 'four_sharing', label: 'Four Sharing' },
];

export const FilterSidebar = ({
  filters,
  onFilterChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleTextChange = (e) => {
    onFilterChange({ [e.target.name]: e.target.value });
  };

  const handleGenderChange = (val) => {
    onFilterChange({ genderPreference: val === 'all' ? '' : val });
  };

  const handleRoomTypeToggle = (type) => {
    const current = filters.roomType ? filters.roomType.split(',').filter(Boolean) : [];
    const updated = current.includes(type)
      ? current.filter((existingType) => existingType !== type)
      : [...current, type];
    onFilterChange({ roomType: updated.join(',') });
  };

  const handleAmenityToggle = (amenity) => {
    const current = filters.amenities ? filters.amenities.split(',').filter(Boolean) : [];
    const updated = current.includes(amenity)
      ? current.filter((existingAmenity) => existingAmenity !== amenity)
      : [...current, amenity];
    onFilterChange({ amenities: updated.join(',') });
  };

  const selectedRoomTypes = filters.roomType ? filters.roomType.split(',').filter(Boolean) : [];
  const selectedAmenities = filters.amenities ? filters.amenities.split(',').filter(Boolean) : [];

  const filterContent = (
    <div className="space-y-6 text-xs text-theme-secondary">
      {/* Search Input */}
      <div>
        <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
          Keywords / Property Name
        </label>
        <div className="relative">
          <input
            type="text"
            name="q"
            value={filters.q || ''}
            onChange={handleTextChange}
            placeholder="e.g. Luxury PG, Koramangala..."
            className="w-full rounded-lg border border-theme-border bg-theme-surface py-2 pl-9 pr-3 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-theme-muted" />
        </div>
      </div>

      {/* City & Area */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city || ''}
            onChange={handleTextChange}
            placeholder="Bangalore"
            className="w-full rounded-lg border border-theme-border bg-theme-surface py-2 px-3 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
          />
        </div>
        <div>
          <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1.5">
            Locality / Area
          </label>
          <input
            type="text"
            name="area"
            value={filters.area || ''}
            onChange={handleTextChange}
            placeholder="e.g. HSR Layout"
            className="w-full rounded-lg border border-theme-border bg-theme-surface py-2 px-3 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
          />
        </div>
      </div>

      {/* Gender Category */}
      <div>
        <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-2">
          Gender Preference
        </label>
        <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-theme-surface-hover border border-theme-border p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'boys', label: 'Boys' },
            { id: 'girls', label: 'Girls' },
            { id: 'coliving', label: 'Co-Ed' },
          ].map((item) => {
            const isSelected = (!filters.genderPreference && item.id === 'all') || filters.genderPreference === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleGenderChange(item.id)}
                className={`rounded py-1.5 text-center text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-theme-surface text-theme-brand shadow-xs border border-theme-border'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget / Rent Range */}
      <div>
        <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-2">
          Monthly Rent Budget (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-theme-muted">Min Rent</span>
            <input
              type="number"
              name="minRent"
              value={filters.minRent || ''}
              onChange={handleTextChange}
              placeholder="₹ 3,000"
              className="mt-1 w-full rounded-lg border border-theme-border bg-theme-surface py-1.5 px-3 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
            />
          </div>
          <div>
            <span className="text-[11px] text-theme-muted">Max Rent</span>
            <input
              type="number"
              name="maxRent"
              value={filters.maxRent || ''}
              onChange={handleTextChange}
              placeholder="₹ 20,000"
              className="mt-1 w-full rounded-lg border border-theme-border bg-theme-surface py-1.5 px-3 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Room Sharing Type */}
      <div>
        <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-2">
          Room Sharing Type
        </label>
        <div className="space-y-2">
          {ROOM_TYPE_OPTIONS.map((option) => (
            <label key={option.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedRoomTypes.includes(option.id)}
                onChange={() => handleRoomTypeToggle(option.id)}
                className="h-3.5 w-3.5 rounded border-theme-border bg-theme-surface text-theme-brand focus:ring-theme-brand"
              />
              <span className="text-theme-secondary group-hover:text-theme-primary transition-colors">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-2">
          Included Amenities
        </label>
        <div className="space-y-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="h-3.5 w-3.5 rounded border-theme-border bg-theme-surface text-theme-brand focus:ring-theme-brand"
              />
              <span className="text-theme-secondary group-hover:text-theme-primary transition-colors">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-theme-border">
        <button
          type="button"
          onClick={onResetFilters}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 text-theme-muted" />
          <span>Reset All Filters</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs h-fit sticky top-24 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-theme-border mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-theme-brand" />
            <h2 className="text-sm font-bold text-theme-primary">Filters</h2>
          </div>
        </div>
        {filterContent}
      </aside>

      {/* Mobile Drawer Modal */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-theme-surface border-l border-theme-border p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-theme-border mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-theme-brand" />
                <h2 className="text-sm font-bold text-theme-primary">Search Filters</h2>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSidebar;
