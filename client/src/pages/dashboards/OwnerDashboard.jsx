import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchOwnerListings } from '../../services/pgClient.js';
import { getOwnerBookingsApi } from '../../services/bookingClient.js';
import { getOwnerReceivedPaymentsApi } from '../../services/paymentClient.js';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  BedDouble,
  Inbox,
  ArrowRight,
  Loader2,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Coins,
} from 'lucide-react';

export const OwnerDashboard = () => {
  const { user } = useAuth();

  const { data: listingsData, isLoading: isListingsLoading } = useQuery({
    queryKey: ['ownerListings'],
    queryFn: fetchOwnerListings,
  });

  const { data: bookingData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['ownerBookings', 'pending'],
    queryFn: () => getOwnerBookingsApi({ status: 'pending' }),
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['ownerReceivedPayments'],
    queryFn: getOwnerReceivedPaymentsApi,
  });

  const pendingRequestsCount = bookingData?.data?.pagination?.total || 0;
  const listings = listingsData?.data?.listings || [];
  const payments = paymentsData?.data?.payments || [];

  const totalBeds = listings.reduce(
    (sum, pg) => sum + (pg.roomSummary?.totalBeds || 0),
    0
  );
  const occupiedBeds = listings.reduce(
    (sum, pg) => sum + (pg.roomSummary?.occupiedBeds || 0),
    0
  );
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Calculate total token deposit revenue collected
  const totalTokenRevenue =
    paymentsData?.data?.totalAmount ||
    payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Owner Portal</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              PG Owner
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Property management workspace for <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/owner/listings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>My Listings ({listings.length})</span>
          </Link>
          <Link
            to="/owner/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Inbox className="h-3.5 w-3.5 text-amber-600" />
            <span>Tenant Requests ({pendingRequestsCount})</span>
          </Link>
          <Link
            to="/owner/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tokens Collected</span>
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

      {/* Pending Tenant Inquiries Alert Banner */}
      {pendingRequestsCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {pendingRequestsCount} Pending Tenant Booking {pendingRequestsCount === 1 ? 'Request' : 'Requests'}
                </h3>
                <p className="mt-0.5 text-xs text-amber-800">
                  Tenants are waiting for your approval. Once you approve, they receive a booking token link to lock their bed.
                </p>
              </div>
            </div>
            <Link
              to="/owner/bookings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors shrink-0"
            >
              <span>Review Requests &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4-Column Summary Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Listings */}
        <Link
          to="/owner/listings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Listings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{listings.length}</div>
          <p className="mt-1 text-xs text-slate-500">Configured properties &rarr;</p>
        </Link>

        {/* Card 2: Bed Occupancy */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bed Occupancy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {occupiedBeds} <span className="text-sm font-normal text-slate-500">/ {totalBeds} beds</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {occupancyRate}%
            </span>
          </div>
          {/* Visual occupancy bar */}
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Occupied vs total bed inventory</p>
        </div>

        {/* Card 3: Pending Tenant Requests */}
        <Link
          to="/owner/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tenant Requests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{pendingRequestsCount}</div>
          <p className="mt-1 text-xs text-slate-500">Pending booking requests &rarr;</p>
        </Link>

        {/* Card 4: Advance Tokens Collected */}
        <Link
          to="/owner/payments"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tokens Collected
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            ₹{totalTokenRevenue.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {payments.filter((p) => p.status === 'paid').length} payments received &rarr;
          </p>
        </Link>
      </div>

      {/* Accommodations Management Section */}
      {isListingsLoading ? (
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
            You have not created any PG listings yet. Add your property, configure booking token deposits, and specify room types.
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
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Managed Accommodations</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor room inventory, token amounts, and approval status across your properties.
                </p>
              </div>
              <Link
                to="/owner/listings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <span>View All Listings ({listings.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {listings.slice(0, 5).map((pg) => {
                const pgTotal = pg.roomSummary?.totalBeds || 0;
                const pgOccupied = pg.roomSummary?.occupiedBeds || 0;
                const pgAvailable = pg.roomSummary?.availableBeds || 0;

                return (
                  <div
                    key={pg._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {pg.images?.[0]?.url ? (
                          <img
                            src={pg.images[0].url}
                            alt={pg.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{pg.title}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              pg.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {pg.status === 'approved' ? 'Live' : 'Pending Verification'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{pg.area}, {pg.city}</span>
                          <span>&bull;</span>
                          <span className="font-medium text-slate-700">
                            Token: ₹{(pg.bookingTokenAmount || 1000).toLocaleString('en-IN')}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {pgOccupied}/{pgTotal} Beds Occupied ({pgAvailable} free)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <Link
                        to={`/owner/listings/${pg._id}/rooms`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Manage Rooms
                      </Link>
                      <Link
                        to={`/owner/listings/${pg._id}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Received Token Deposits Strip */}
          {payments.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Recent Token Payments Received</h2>
                    <p className="text-[11px] text-slate-500">
                      Tenant online booking tokens credited to your account via Razorpay
                    </p>
                  </div>
                </div>
                <Link
                  to="/owner/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <span>View All Payments &rarr;</span>
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {payments.slice(0, 3).map((payment) => (
                  <div
                    key={payment._id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {payment.tenant?.name || 'Tenant'} &bull; {payment.pg?.title || 'Accommodation'}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Order #{payment.razorpayOrderId} &bull;{' '}
                        {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm">
                        +₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Received</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
