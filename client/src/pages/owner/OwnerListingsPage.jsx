import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchOwnerListings, deleteListingApi } from '../../services/pgClient.js';
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved & Live</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            <span>Action Required</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Verification</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My PG Listings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your accommodations, inspect verification status, and configure room inventories
          </p>
        </div>
        <div>
          <Link
            to="/owner/listings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>List New Property</span>
          </Link>
        </div>
      </div>

      {deleteError && (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{deleteError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-brand-600" />
          Loading your property listings...
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="mt-2 text-sm font-semibold text-rose-900">Failed to load listings</h3>
          <p className="mt-1 text-xs text-rose-700">{error?.message || 'Server error occurred'}</p>
          {(error?.status === 403 || error?.message?.includes('Insufficient permissions')) && (
            <div className="mt-4">
              <p className="text-[11px] text-slate-600 mb-2">
                Your browser session cookie may be active under a Tenant account. Please sign out and sign back in with your Owner account.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                Sign In With Owner Account
              </button>
            </div>
          )}
        </div>
      ) : listings.length === 0 ? (
        /* Real Empty State */
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No PG Accommodations Listed Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            You have not registered any accommodations. Add your property details, upload photos, and configure room sharing to start receiving tenant booking requests.
          </p>
          <div className="mt-6">
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Submit First Listing</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((pg) => {
            const primaryImage = pg.images?.[0]?.url;
            const summary = pg.roomSummary || {};

            return (
              <div
                key={pg._id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Image & Status Badge */}
                <div className="relative h-48 w-full bg-slate-100">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={pg.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Building2 className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{getStatusBadge(pg.status)}</div>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
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
                  <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{pg.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-1">{pg.area}, {pg.city}</span>
                  </div>

                  {/* Room & Occupancy Metrics */}
                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Rooms & Capacity:</span>
                      <span className="font-semibold text-slate-800">
                        {summary.totalRooms} Rooms &bull; {summary.totalBeds} Beds
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Available Beds:</span>
                      <span className="font-semibold text-emerald-600">
                        {summary.availableBeds} Vacant
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Monthly Rent:</span>
                      <span className="font-semibold text-slate-800">
                        {summary.minRent > 0
                          ? `₹${summary.minRent.toLocaleString()} - ₹${summary.maxRent.toLocaleString()}`
                          : 'No rooms added'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to={`/owner/listings/${pg._id}/rooms`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <BedDouble className="h-3.5 w-3.5 text-brand-600" />
                      <span>Rooms ({summary.totalRooms})</span>
                    </Link>
                    <Link
                      to={`/pg/${pg._id}`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Preview</span>
                    </Link>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to={`/owner/listings/${pg._id}/edit`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                      <span>Edit Info</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(pg._id, pg.title)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white py-1.5 font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
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
