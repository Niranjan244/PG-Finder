import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Utensils,
  Wifi,
  BedDouble,
  Heart,
  Star,
  Loader2,
  Navigation,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
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
      navigate('/login');
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
        return 'bg-blue-600/90 text-white border-blue-400/30';
      case 'girls':
        return 'bg-rose-600/90 text-white border-rose-400/30';
      default:
        return 'bg-violet-600/90 text-white border-violet-400/30';
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-theme-brand hover:ring-1 hover:ring-theme-brand/30 hover:shadow-md"
    >
      {/* Media Image Container with Aspect Ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-theme-surface-hover">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={pg.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-theme-muted bg-theme-surface-subtle">
            <Building2 className="h-12 w-12 stroke-[1.25]" />
          </div>
        )}

        {/* Soft Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />

        {/* Gender Badge (Top Left) */}
        <div className="absolute top-3 left-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-xs backdrop-blur-md ${getGenderBadge(
              pg.genderPreference
            )}`}
          >
            {getGenderLabel(pg.genderPreference)}
          </span>
        </div>

        {/* Top Right Badges: Vacancy & Wishlist Heart */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md ${
              isFull
                ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
                : 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
            }`}
          >
            {isFull ? 'Full' : `${summary.availableBeds || 0} Beds Left`}
          </span>

          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={isTogglingWishlist}
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-white border border-white/20 shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-slate-950/80 active:scale-95"
          >
            {isTogglingWishlist ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isSaved
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-white hover:text-rose-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Pricing Overlay at Bottom of Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
          <div className="drop-shadow-md">
            <span className="text-base sm:text-lg font-extrabold tracking-tight">
              {pg.rentRange?.minRent > 0
                ? `₹${pg.rentRange.minRent.toLocaleString()}`
                : 'Pricing on Request'}
            </span>
            {pg.rentRange?.minRent > 0 && (
              <span className="text-xs font-normal text-white/85 ml-1">
                {pg.rentRange.maxRent > pg.rentRange.minRent
                  ? `- ₹${pg.rentRange.maxRent.toLocaleString()} / mo`
                  : '/ mo'}
              </span>
            )}
          </div>
          {pg.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white border border-emerald-300/30">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Property Details Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-theme-primary group-hover:text-theme-brand transition-colors line-clamp-1">
              {pg.title}
            </h3>

            {/* Rating Indicator */}
            <div className="flex items-center gap-1 shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              <span>{pg.averageRating > 0 ? Number(pg.averageRating).toFixed(1) : 'New'}</span>
              {pg.reviewCount > 0 && (
                <span className="text-[10px] font-normal opacity-75">({pg.reviewCount})</span>
              )}
            </div>
          </div>

          {/* Location & Distance */}
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-theme-muted">
            <div className="flex items-center gap-1.5 min-w-0 line-clamp-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
              <span className="truncate">{pg.area}, {pg.city}</span>
            </div>

            {pg.distanceKm !== undefined && pg.distanceKm !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-theme-brand/10 px-2 py-0.5 text-[10px] font-bold text-theme-brand shrink-0 border border-theme-brand/20">
                <Navigation className="h-2.5 w-2.5" />
                <span>
                  {pg.distanceKm < 1
                    ? `${Math.round(pg.distanceMeters || pg.distanceKm * 1000)} m`
                    : `${pg.distanceKm} km`}
                </span>
              </span>
            )}
          </div>

          {/* Feature Tags / Amenities */}
          <div className="mt-3.5 flex flex-wrap gap-1.5 text-xs">
            {pg.foodDetails?.available && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-theme-secondary border border-slate-200/80 dark:border-slate-700/60 transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600">
                <Utensils className="h-3 w-3 text-amber-500" />
                <span>Food Inc.</span>
              </span>
            )}
            {pg.wifi && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-theme-secondary border border-slate-200/80 dark:border-slate-700/60 transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600">
                <Wifi className="h-3 w-3 text-sky-500" />
                <span>Wi-Fi</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-theme-secondary border border-slate-200/80 dark:border-slate-700/60 transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600">
              <BedDouble className="h-3 w-3 text-indigo-500" />
              <span>{summary.totalRooms || 0} Rooms</span>
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3.5 border-t border-theme-border/70 flex items-center justify-between text-xs text-theme-muted">
          <span>Deposit: ₹{pg.deposit?.toLocaleString() || 0}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-theme-brand transition-all duration-200 group-hover:translate-x-0.5">
            <span>View Rooms</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PGCard;