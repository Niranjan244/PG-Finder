import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWishlistApi } from '../../services/wishlistClient.js';
import { PGCard } from '../../components/search/PGCard.jsx';
import {
  Heart,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';

export const WishlistPage = () => {
  const [page, setPage] = useState(1);

  const { data: wishlistData, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['userWishlist', page],
    queryFn: () => fetchWishlistApi({ page, limit: 12 }),
    keepPreviousData: true,
  });

  const listings = wishlistData?.data?.listings || [];
  const pagination = wishlistData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <Heart className="h-4 w-4 fill-rose-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-theme-primary sm:text-2xl">
              Saved Accommodations
            </h1>
            {!isLoading && (
              <span className="rounded-full bg-theme-surface-hover border border-theme-border px-2.5 py-0.5 text-xs font-semibold text-theme-secondary">
                {pagination.total} {pagination.total === 1 ? 'property' : 'properties'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-theme-muted">
            Compare and revisit properties you bookmarked during your search.
          </p>
        </div>

        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary shadow-xs transition-colors self-start sm:self-auto"
        >
          <Compass className="h-3.5 w-3.5 text-theme-brand" />
          <span>Explore More PGs</span>
        </Link>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-theme-brand" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-theme-error/30 bg-theme-error-subtle p-6 text-center text-xs text-theme-error">
          Failed to load saved accommodations. {error?.message || 'Please refresh.'}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-12 text-center shadow-xs transition-colors">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-theme-primary">No Saved Accommodations Yet</h2>
          <p className="mt-1.5 text-xs text-theme-muted max-w-md mx-auto">
            Browse through verified PG listings and tap the heart icon on any card to save it here for fast comparisons and easy booking.
          </p>
          <div className="mt-6">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span>Explore Verified PGs</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((pg) => (
              <PGCard key={pg._id} pg={pg} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-theme-border pt-4">
              <span className="text-xs text-theme-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={pagination.page <= 1 || isFetching}
                  className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-40 shadow-xs transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage((prev) => Math.min(pagination.totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={pagination.page >= pagination.totalPages || isFetching}
                  className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary disabled:opacity-40 shadow-xs transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WishlistPage;
