import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchOwnerListings } from '../../services/pgClient.js';
import { getOwnerBookingsApi } from '../../services/bookingClient.js';
import { getOwnerReceivedPaymentsApi } from '../../services/paymentClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  BedDouble,
  Inbox,
  ArrowRight,
  Loader2,
  Receipt,
  CheckCircle2,
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
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Owner Portal"
        description={`Property workspace for ${user?.name || 'Owner'}. Monitor live bed occupancy, review tenant inquiries, and track advance tokens.`}
        badge="PG Owner"
        actions={
          <>
            <Link
              to="/owner/listings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <span>My Listings ({listings.length})</span>
            </Link>
            <Link
              to="/owner/bookings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <Inbox className="h-3.5 w-3.5 text-amber-600" />
              <span>Requests ({pendingRequestsCount})</span>
            </Link>
            <Link
              to="/owner/payments"
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tokens Received</span>
            </Link>
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>List Property</span>
            </Link>
          </>
        }
      />

      {/* Pending Tenant Inquiries Alert Banner */}
      {pendingRequestsCount > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-theme-surface p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-theme-primary">
                  {pendingRequestsCount} Pending Tenant Booking {pendingRequestsCount === 1 ? 'Request' : 'Requests'}
                </h3>
                <p className="mt-0.5 text-xs text-theme-secondary">
                  Tenants are waiting for your approval. Once you approve, they receive a booking token link to lock their bed.
                </p>
              </div>
            </div>
            <Link
              to="/owner/bookings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition-colors shrink-0"
            >
              <span>Review Requests &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Listings"
          value={listings.length}
          subtitle="Managed accommodations"
          icon={Building2}
          variant="brand"
          to="/owner/listings"
        />

        <StatCard
          title="Bed Occupancy"
          value={`${occupiedBeds} / ${totalBeds}`}
          subtitle={`${occupancyRate}% overall capacity occupied`}
          icon={BedDouble}
          variant="success"
          progressBar={occupancyRate}
        />

        <StatCard
          title="Tenant Requests"
          value={pendingRequestsCount}
          subtitle="Awaiting owner review"
          icon={Inbox}
          variant="warning"
          to="/owner/bookings"
        />

        <StatCard
          title="Tokens Collected"
          value={`₹${totalTokenRevenue.toLocaleString('en-IN')}`}
          subtitle={`${payments.filter((p) => p.status === 'paid').length} verified transactions`}
          icon={Coins}
          variant="indigo"
          to="/owner/payments"
        />
      </div>

      {/* Accommodations Management Section */}
      {isListingsLoading ? (
        <div className="flex items-center justify-center py-12 text-xs text-theme-muted bg-theme-surface rounded-xl border border-theme-border">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading accommodations...
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Accommodations Listed Yet"
          description="You haven't created any PG listings yet. Add your property, configure booking token deposits, and specify room types to receive bookings."
          actionLabel="List New Property"
          actionTo="/owner/listings/new"
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-theme-border bg-theme-surface shadow-2xs overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-5 border-b border-theme-border">
              <div>
                <h2 className="text-sm font-bold text-theme-primary">
                  Managed Properties & Occupancy
                </h2>
                <p className="text-xs text-theme-muted mt-0.5">
                  Monitor room inventory, token amounts, and approval status across your accommodations.
                </p>
              </div>
              <Link
                to="/owner/listings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-theme-brand hover:underline transition-colors"
              >
                <span>View All Listings ({listings.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-theme-border">
              {listings.slice(0, 5).map((pg) => {
                const pgTotal = pg.roomSummary?.totalBeds || 0;
                const pgOccupied = pg.roomSummary?.occupiedBeds || 0;
                const pgAvailable = pg.roomSummary?.availableBeds || 0;

                return (
                  <div
                    key={pg._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-theme-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-lg bg-theme-surface-subtle overflow-hidden shrink-0 border border-theme-border">
                        {pg.images?.[0]?.url ? (
                          <img
                            src={pg.images[0].url}
                            alt={pg.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-theme-muted">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-theme-primary">{pg.title}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              pg.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            }`}
                          >
                            {pg.status === 'approved' ? 'Live' : 'Pending Verification'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-theme-muted mt-1">
                          <span>{pg.area}, {pg.city}</span>
                          <span>&bull;</span>
                          <span className="font-medium text-theme-secondary">
                            Token: ₹{(pg.bookingTokenAmount || 1000).toLocaleString('en-IN')}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {pgOccupied}/{pgTotal} Beds Occupied ({pgAvailable} free)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/owner/listings/${pg._id}/rooms`}
                        className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
                      >
                        Manage Rooms
                      </Link>
                      <Link
                        to={`/owner/listings/${pg._id}/edit`}
                        className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
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
            <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-theme-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-theme-primary">Recent Token Deposits Received</h2>
                    <p className="text-[11px] text-theme-muted">
                      Tenant online booking tokens credited to your account via Razorpay
                    </p>
                  </div>
                </div>
                <Link
                  to="/owner/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-theme-brand hover:underline transition-colors"
                >
                  <span>View All Payments &rarr;</span>
                </Link>
              </div>

              <div className="divide-y divide-theme-border mt-1">
                {payments.slice(0, 3).map((payment) => (
                  <div
                    key={payment._id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-theme-primary">
                        {payment.tenant?.name || 'Tenant'} &bull; {payment.pg?.title || 'Accommodation'}
                      </div>
                      <div className="text-theme-muted text-[11px] font-mono mt-0.5">
                        Order #{payment.razorpayOrderId} &bull;{' '}
                        {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        +₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
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
