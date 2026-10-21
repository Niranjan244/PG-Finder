import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Utensils, Wifi, BedDouble, Heart, Star, Loader2, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchWishlistIdsApi, toggleWishlistApi } from '../../services/wishlistClient.js';

export const PGCard = ({ pg }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Fetch saved PG IDs for the authenticated user
  const { data: wishlistData } = useQuery({
    queryKey: ['userWishlistIds'],
    queryFn: fetchWishlistIdsApi,
    enabled: Boolean(isAuthenticated),
    staleTime: 60000,
  });

  const savedIds = wishlistData?.data?.wishlistIds || [];
  const isSaved = savedIds.includes(pg._id);

  const primaryImage = pg.images?.[0]?.url;
  const summary = pg.roomSummary || {};
  const isFull = summary.availableBeds === 0 && summary.totalBeds > 0;

  const handleWishlistClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    try {
      setIsTogglingWishlist(true);
      await toggleWishlistApi(pg._id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userWishlistIds'] }),
        queryClient.invalidateQueries({ queryKey: ['userWishlist'] }),
      ]);
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const getGenderBadge = (preference) => {
    switch (preference) {
      case 'boys':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'girls':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    }
  };

  const getGenderLabel = (preference) => {
    switch (preference) {
      case 'boys':
        return 'Boys Only';
      case 'girls':
        return 'Girls Only';
      default:
        return 'Co-Living';
    }
  };

  return (
    <Link
      to={{
        pathname: `/pg/${pg._id}`,
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: '#rooms',
      }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs transition-all hover:shadow-md hover:border-theme-border/80"
    >
      {/* Media Image */}
      <div className="relative h-48 w-full overflow-hidden bg-theme-surface-hover">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={pg.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-theme-muted">
            <Building2 className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        {/* Gender Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs ${getGenderBadge(
              pg.genderPreference
            )}`}
          >
            {getGenderLabel(pg.genderPreference)}
          </span>
        </div>

        {/* Top Right Badges: Vacancy + Wishlist Heart */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border backdrop-blur-xs ${
              isFull
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {isFull ? 'Full' : `${summary.availableBeds || 0} Beds Left`}
          </span>

          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={isTogglingWishlist}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-surface/90 text-theme-secondary border border-theme-border shadow-xs backdrop-blur transition-all hover:scale-110 hover:bg-theme-surface active:scale-95"
          >
            {isTogglingWishlist ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-muted" />
            ) : (
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  isSaved
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-theme-secondary hover:text-rose-500'
                }`}
              />
            )}
          </button>
        </div>

        {/* Pricing overlay at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="rounded bg-slate-900/80 px-2 py-0.5 font-bold backdrop-blur">
            {pg.rentRange?.minRent > 0
              ? `₹${pg.rentRange.minRent.toLocaleString()}${
                  pg.rentRange.maxRent > pg.rentRange.minRent
                    ? ` - ₹${pg.rentRange.maxRent.toLocaleString()}`
                    : ''
                } / mo`
              : 'Pricing on Request'}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-theme-primary group-hover:text-theme-brand transition-colors line-clamp-1">
            {pg.title}
          </h3>

          {/* Rating indicator */}
          <div className="flex items-center gap-1 shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            <span>{pg.averageRating > 0 ? Number(pg.averageRating).toFixed(1) : 'New'}</span>
            {pg.reviewCount > 0 && (
              <span className="font-normal opacity-80">({pg.reviewCount})</span>
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-theme-muted">
          <div className="flex items-center gap-1.5 line-clamp-1 min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
            <span className="line-clamp-1">{pg.area}, {pg.city}</span>
          </div>
          {pg.distanceKm !== undefined && pg.distanceKm !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-theme-brand-subtle px-2 py-0.5 text-[10px] font-bold text-theme-brand shrink-0 border border-theme-border/60">
              <Navigation className="h-2.5 w-2.5" />
              <span>{pg.distanceKm < 1 ? `${Math.round(pg.distanceMeters || pg.distanceKm * 1000)} m away` : `${pg.distanceKm} km away`}</span>
            </span>
          )}
        </div>

        {/* Feature Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {pg.foodDetails?.available && (
            <span className="inline-flex items-center gap-1 rounded bg-theme-surface-hover px-2 py-0.5 text-theme-secondary border border-theme-border/60">
              <Utensils className="h-3 w-3" />
              <span>Food Inc.</span>
            </span>
          )}
          {pg.wifi && (
            <span className="inline-flex items-center gap-1 rounded bg-theme-surface-hover px-2 py-0.5 text-theme-secondary border border-theme-border/60">
              <Wifi className="h-3 w-3" />
              <span>Wi-Fi</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded bg-theme-surface-hover px-2 py-0.5 text-theme-secondary border border-theme-border/60">
            <BedDouble className="h-3 w-3" />
            <span>{summary.totalRooms || 0} Rooms</span>
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-muted">
          <span>Deposit: ₹{pg.deposit?.toLocaleString() || 0}</span>
          <span className="font-semibold text-theme-brand group-hover:underline">View Rooms &rarr;</span>
        </div>
      </div>
    </Link>
  );
};

export default PGCard;
