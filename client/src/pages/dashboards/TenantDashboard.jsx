import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { getMyBookingsApi } from '../../services/bookingClient.js';
import { getMyPaymentsApi } from '../../services/paymentClient.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  CalendarCheck,
  Search,
  Bell,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Receipt,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TenantDashboard = () => {
  const { user } = useAuth();

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookingsApi,
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['myPayments'],
    queryFn: getMyPaymentsApi,
  });

  const bookings = bookingsData?.data || [];
  const payments = paymentsData?.data?.payments || [];

  // Categorize bookings accurately
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const awaitingPaymentBookings = bookings.filter(
    (b) => b.status === 'approved' && b.paymentStatus !== 'paid'
  );
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  // Calculate total token deposit amount paid
  const totalPaidAmount = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Tenant Overview"
        description={`Welcome back, ${user?.name || 'Tenant'}. Track room reservation statuses, lock beds with booking tokens, and download receipts.`}
        badge="Tenant"
        actions={
          <>
            <Link
              to="/tenant/bookings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <span>My Bookings ({bookings.length})</span>
            </Link>
            <Link
              to="/tenant/payments"
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment Receipts ({payments.length})</span>
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search PGs</span>
            </Link>
          </>
        }
      />

      {/* Action Required Alert Banner (when owner approved booking and waiting on token) */}
      {awaitingPaymentBookings.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-theme-surface p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-theme-primary">
                    Action Required: Booking Approved!
                  </h3>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Hold Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-theme-secondary leading-relaxed max-w-2xl">
                  Your application for{' '}
                  <span className="font-semibold text-theme-primary">
                    {awaitingPaymentBookings[0].pg?.title || 'Accommodation'}
                  </span>{' '}
                  has been approved by the owner. Pay the booking token deposit of{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{(awaitingPaymentBookings[0].pg?.bookingTokenAmount || 1000).toLocaleString('en-IN')}
                  </span>{' '}
                  via Razorpay to secure your room before the hold expires.
                </p>
              </div>
            </div>

            <Link
              to="/tenant/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition-all shrink-0"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Token Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Confirmed Stays"
          value={confirmedCount}
          subtitle="Token paid & room locked"
          icon={CalendarCheck}
          variant="success"
          to="/tenant/bookings"
        />

        <StatCard
          title="Awaiting Payment"
          value={awaitingPaymentBookings.length}
          subtitle="Owner approved, lock room"
          icon={Clock}
          variant="warning"
          to="/tenant/bookings"
        />

        <StatCard
          title="Pending Requests"
          value={pendingCount}
          subtitle="Under property owner review"
          icon={Bell}
          variant="brand"
          to="/tenant/bookings"
        />

        <StatCard
          title="Tokens Paid"
          value={`₹${totalPaidAmount.toLocaleString('en-IN')}`}
          subtitle={`${payments.filter((p) => p.status === 'paid').length} verified transactions`}
          icon={Receipt}
          variant="indigo"
          to="/tenant/payments"
        />
      </div>

      {/* Main Content Area: Active Bookings or Empty State */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Room Reservations Yet"
          description="You haven't submitted any PG booking inquiries yet. Discover verified properties with real photos, amenities, and pricing."
          actionLabel="Explore Verified Accommodations"
          actionTo="/search"
        />
      ) : (
        <div className="space-y-6">
          {/* Active Bookings Card */}
          <div className="rounded-xl border border-theme-border bg-theme-surface shadow-2xs overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-5 border-b border-theme-border">
              <div>
                <h2 className="text-sm font-bold text-theme-primary">
                  Recent Applications & Stays
                </h2>
                <p className="text-xs text-theme-muted mt-0.5">
                  Track room reservation progress and lock your stay with booking tokens.
                </p>
              </div>
              <Link
                to="/tenant/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-theme-brand hover:underline transition-colors"
              >
                <span>View All ({bookings.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-theme-border">
              {bookings.slice(0, 4).map((booking) => {
                const isApprovedAwaitingPayment =
                  booking.status === 'approved' && booking.paymentStatus !== 'paid';

                return (
                  <div
                    key={booking._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-theme-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-lg bg-theme-surface-subtle overflow-hidden shrink-0 border border-theme-border">
                        {booking.pg?.images?.[0]?.url ? (
                          <img
                            src={booking.pg.images[0].url}
                            alt={booking.pg?.title || 'PG'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-theme-muted">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-theme-primary">
                          {booking.pg?.title || 'Accommodation'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-theme-muted mt-0.5">
                          <span>
                            {booking.room?.roomType || 'Standard'} Sharing
                          </span>
                          <span>&bull;</span>
                          <span>
                            Move-in:{' '}
                            {booking.moveInDate
                              ? new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Flexible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <BookingStatusBadge
                        status={booking.status}
                        paymentStatus={booking.paymentStatus}
                      />

                      {isApprovedAwaitingPayment ? (
                        <Link
                          to="/tenant/bookings"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Token (₹{booking.pg?.bookingTokenAmount || 1000})</span>
                        </Link>
                      ) : (
                        <Link
                          to="/tenant/bookings"
                          className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Payment Receipts Preview */}
          {payments.length > 0 && (
            <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between pb-4 border-b border-theme-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-theme-primary">Recent Token Receipts</h2>
                    <p className="text-[11px] text-theme-muted">
                      Razorpay online token deposits verified for your bookings
                    </p>
                  </div>
                </div>
                <Link
                  to="/tenant/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-theme-brand hover:underline transition-colors"
                >
                  <span>View All Receipts &rarr;</span>
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
                        {payment.pg?.title || 'PG Booking Token'}
                      </div>
                      <div className="text-theme-muted text-[11px] font-mono mt-0.5">
                        Order #{payment.razorpayOrderId} &bull;{' '}
                        {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Paid</span>
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

export default TenantDashboard;
