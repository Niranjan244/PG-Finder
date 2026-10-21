import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, MapPin, Loader2, Sparkles } from 'lucide-react';
import { searchPGsApi } from '../../services/pgClient.js';

export const FeaturedPGs = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['featuredPGs'],
    queryFn: () => searchPGsApi({ limit: 6, sort: 'newest' }),
    staleTime: 60000,
  });

  const listings = data?.data?.listings || [];

  const getGenderBadge = (gender) => {
    switch (gender) {
      case 'boys':
        return { label: 'Boys', style: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
      case 'girls':
        return { label: 'Girls', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Coliving', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    }
  };

  return (
    <section id="featured-pgs" className="py-16 sm:py-20 border-b border-theme-border transition-colors">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-brand mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Accommodations</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
              Featured PGs
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-theme-secondary">
              Explore recently verified and approved accommodations on our platform.
            </p>
          </div>

          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-brand hover:text-theme-brand-hover transition-colors shrink-0"
          >
            <span>View all PGs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-theme-border bg-theme-surface p-4 animate-pulse space-y-3"
              >
                <div className="h-44 w-full rounded-xl bg-theme-surface-hover" />
                <div className="h-4 w-3/4 rounded bg-theme-surface-hover" />
                <div className="h-3 w-1/2 rounded bg-theme-surface-hover" />
                <div className="h-6 w-1/3 rounded bg-theme-surface-hover pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error or Empty State */}
        {!isLoading && (isError || listings.length === 0) && (
          <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center max-w-xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-surface-hover text-theme-muted mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-theme-primary">No verified PGs listed yet</h3>
            <p className="mt-1.5 text-xs text-theme-secondary leading-relaxed">
              New accommodations are currently being reviewed. If you are a property owner, list your PG today with zero brokerage fees.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/register?role=owner"
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                <span>List your PG</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Real Verified Listings Grid */}
        {!isLoading && !isError && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((pg) => {
              const gender = getGenderBadge(pg.genderPreference);
              const imageUrl = pg.images?.[0]?.url;
              const minRent = pg.rentRange?.minRent || 0;
              const availableBeds = pg.roomSummary?.availableBeds;

              return (
                <Link
                  key={pg._id}
                  to={`/pg/${pg._id}`}
                  className="group rounded-2xl border border-theme-border bg-theme-surface overflow-hidden shadow-xs hover:border-theme-brand/60 hover:shadow-sm transition-all flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full bg-theme-surface-hover overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={pg.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-theme-muted">
                        <Building2 className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${gender.style}`}
                      >
                        {gender.label}
                      </span>
                    </div>

                    {availableBeds !== undefined && (
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center rounded-full bg-theme-surface/90 border border-theme-border px-2.5 py-0.5 text-[10px] font-medium text-theme-primary backdrop-blur-md">
                          {availableBeds > 0 ? `${availableBeds} beds available` : 'Full'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-theme-primary group-hover:text-theme-brand transition-colors line-clamp-1">
                        {pg.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-theme-muted line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-theme-brand" />
                        <span>{pg.area}, {pg.city}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-theme-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-theme-brand">
                          ₹{minRent.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-theme-muted"> / mo</span>
                      </div>
                      <span className="text-xs font-semibold text-theme-secondary group-hover:text-theme-primary flex items-center gap-1">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPGs;
