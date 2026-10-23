import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOwnerListings, deleteListingApi } from '../../services/pgClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  Building2,
  Plus,
  BedDouble,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const OwnerListingsPage = () => {
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState('');

  const { data: listingsData, isLoading, isError, error } = useQuery({
    queryKey: ['ownerListings'],
    queryFn: fetchOwnerListings,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteListingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerListings'] });
    },
    onError: (error) => {
      setDeleteError(error.message || 'Failed to delete property listing');
    },
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}" and all its room data?`)) {
      setDeleteError('');
      deleteMutation.mutate(id);
    }
  };

  const listings = listingsData?.data?.listings || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved & Live</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5" />
            <span>Action Required</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Verification</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="My PG Accommodations"
        description="Manage your properties, inspect moderation status, configure room sharing, and set booking token deposits."
        badge={`${listings.length} Properties`}
        actions={
          <Link
            to="/owner/listings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>List New Property</span>
          </Link>
        }
      />

      {deleteError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{deleteError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-theme-muted text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-theme-brand" />
          Loading your accommodations...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="mt-2 text-sm font-semibold text-rose-700 dark:text-rose-300">Failed to load listings</h3>
          <p className="mt-1 text-xs opacity-90">{error?.message || 'Server error occurred'}</p>
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Accommodations Registered Yet"
          description="You haven't listed any PG accommodations yet. Add your property details, upload photos, and configure room sharing to start receiving bookings."
          actionLabel="Submit First Listing"
          actionTo="/owner/listings/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((pg) => {
            const primaryImage = pg.images?.[0]?.url;
            const summary = pg.roomSummary || {};

            return (
              <div
                key={pg._id}
                className="flex flex-col overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-2xs transition hover:shadow-xs"
              >
                {/* Image & Status Badge */}
                <div className="relative h-48 w-full bg-theme-surface-subtle">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={pg.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-theme-muted">
                      <Building2 className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{getStatusBadge(pg.status)}</div>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                      {pg.genderPreference === 'boys'
                        ? 'Boys PG'
                        : pg.genderPreference === 'girls'
                        ? 'Girls PG'
                        : 'Co-Living'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-semibold text-theme-primary line-clamp-1">{pg.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-theme-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
                    <span className="line-clamp-1">{pg.area}, {pg.city}</span>
                  </div>

                  {/* Room & Occupancy Metrics */}
                  <div className="mt-4 rounded-lg bg-theme-surface-subtle p-3 text-xs text-theme-secondary space-y-1.5 border border-theme-border">
                    <div className="flex justify-between items-center">
                      <span className="text-theme-muted">Rooms & Capacity:</span>
                      <span className="font-semibold text-theme-primary">
                        {summary.totalRooms} Rooms &bull; {summary.totalBeds} Beds
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-theme-muted">Available Beds:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {summary.availableBeds} Vacant
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-theme-muted">Token Deposit:</span>
                      <span className="font-semibold text-theme-primary">
                        ₹{(pg.bookingTokenAmount || 1000).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-theme-border grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to={`/owner/listings/${pg._id}/rooms`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface py-2 font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
                    >
                      <BedDouble className="h-3.5 w-3.5 text-theme-brand" />
                      <span>Rooms ({summary.totalRooms})</span>
                    </Link>
                    <Link
                      to={`/pg/${pg._id}`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface py-2 font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-theme-muted" />
                      <span>Preview</span>
                    </Link>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to={`/owner/listings/${pg._id}/edit`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface py-1.5 font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-theme-muted" />
                      <span>Edit Info</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(pg._id, pg.title)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-theme-surface py-1.5 font-medium text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerListingsPage;
