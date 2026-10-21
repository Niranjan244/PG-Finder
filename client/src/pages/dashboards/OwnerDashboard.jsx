import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchOwnerListings } from '../../services/pgClient.js';
import { getOwnerBookingsApi } from '../../services/bookingClient.js';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  BedDouble,
  Inbox,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const OwnerDashboard = () => {
  const { user } = useAuth();

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['ownerListings'],
    queryFn: fetchOwnerListings,
  });

  const { data: bookingData } = useQuery({
    queryKey: ['ownerBookings', 'pending'],
    queryFn: () => getOwnerBookingsApi({ status: 'pending' }),
  });

  const pendingRequestsCount = bookingData?.data?.pagination?.total || 0;
  const listings = listingsData?.data?.listings || [];

  const totalBeds = listings.reduce(
    (sum, pg) => sum + (pg.roomSummary?.totalBeds || 0),
    0
  );
  const occupiedBeds = listings.reduce(
    (sum, pg) => sum + (pg.roomSummary?.occupiedBeds || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Owner Portal</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              PG Owner
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Property management workspace for <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/listings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>My Listings ({listings.length})</span>
          </Link>
          <Link
            to="/owner/listings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>List New Property</span>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 my-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Listings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{listings.length}</div>
          <p className="mt-1 text-xs text-slate-500">Configured accommodations</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bed Occupancy</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {occupiedBeds} / {totalBeds}
          </div>
          <p className="mt-1 text-xs text-slate-500">Occupied vs total bed inventory</p>
        </div>

        <Link
          to="/owner/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant Requests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{pendingRequestsCount}</div>
          <p className="mt-1 text-xs text-slate-500">Pending booking requests &rarr;</p>
        </Link>
      </div>

      {/* Listings Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading accommodations...
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No PG Accommodations Listed Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            You have not created any PG listings yet. Add your property, specify room types, and upload photos to start receiving inquiries.
          </p>
          <div className="mt-6">
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>List New Property</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Accommodations</h2>
            <Link
              to="/owner/listings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {listings.slice(0, 5).map((pg) => (
              <div key={pg._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {pg.images?.[0]?.url ? (
                      <img src={pg.images[0].url} alt={pg.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{pg.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{pg.area}, {pg.city}</span>
                      <span>&bull;</span>
                      <span>{pg.roomSummary?.totalRooms || 0} Rooms</span>
                      <span>&bull;</span>
                      <span>{pg.roomSummary?.availableBeds || 0} Beds Available</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      pg.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {pg.status === 'approved' ? 'Approved' : 'Pending Verification'}
                  </span>
                  <Link
                    to={`/owner/listings/${pg._id}/rooms`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Manage Rooms
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
