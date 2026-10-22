import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { getMyBookingsApi } from '../../services/bookingClient.js';
import { getMyPaymentsApi } from '../../services/paymentClient.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import {
  Bookmark,
  CalendarCheck,
  Search,
  Bell,
  CreditCard,
  Building2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Receipt,
  CheckCircle2,
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Dashboard</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
              Tenant
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tenant/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>My Bookings ({bookings.length})</span>
          </Link>
          <Link
            to="/tenant/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
            <span>Payment Receipts ({payments.length})</span>
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search PGs</span>
          </Link>
        </div>
      </div>

      {/* Action Required Alert Banner (when owner approved booking and waiting on token) */}
      {awaitingPaymentBookings.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-900">
                    Action Required: Booking Approved!
                  </h3>
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Hold Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed max-w-2xl">
                  Your application for{' '}
                  <span className="font-semibold text-slate-900">
                    {awaitingPaymentBookings[0].pg?.title || 'Accommodation'}
                  </span>{' '}
                  has been approved by the owner. Pay the booking token deposit of{' '}
                  <span className="font-bold text-emerald-700">
                    ₹{(awaitingPaymentBookings[0].pg?.bookingTokenAmount || 1000).toLocaleString('en-IN')}
                  </span>{' '}
                  via Razorpay to lock your room before the hold expires.
                </p>
              </div>
            </div>

            <Link
              to="/tenant/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-all shrink-0"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Token Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Confirmed Stays */}
        <Link
          to="/tenant/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Confirmed Stays
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{confirmedCount}</div>
          <p className="mt-1 text-xs text-slate-500">Token paid & room secured &rarr;</p>
        </Link>

        {/* Card 2: Awaiting Payment */}
        <Link
          to="/tenant/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Awaiting Payment
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{awaitingPaymentBookings.length}</div>
          <p className="mt-1 text-xs text-amber-600 font-medium">Approved by owner &rarr;</p>
        </Link>

        {/* Card 3: Pending Review */}
        <Link
          to="/tenant/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Requests
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand-600 group-hover:bg-blue-100 transition-colors">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{pendingCount}</div>
          <p className="mt-1 text-xs text-slate-500">Awaiting owner review &rarr;</p>
        </Link>

        {/* Card 4: Token Deposits Paid */}
        <Link
          to="/tenant/payments"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tokens Paid
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {payments.filter((p) => p.status === 'paid').length} payments processed &rarr;
          </p>
        </Link>
      </div>

      {/* Main Content Area: Active Bookings or Empty State */}
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No Booking Requests Sent Yet</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            You have not applied for any PG accommodation yet. Browse verified properties, check room amenities, and submit booking inquiries.
          </p>
          <div className="mt-6">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Explore Verified PGs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Bookings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Booking Requests & Stays</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track room reservation progress and lock your stay with booking tokens.
                </p>
              </div>
              <Link
                to="/tenant/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <span>View All ({bookings.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {bookings.slice(0, 4).map((booking) => {
                const isApprovedAwaitingPayment =
                  booking.status === 'approved' && booking.paymentStatus !== 'paid';

                return (
                  <div
                    key={booking._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {booking.pg?.images?.[0]?.url ? (
                          <img
                            src={booking.pg.images[0].url}
                            alt={booking.pg?.title || 'PG'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {booking.pg?.title || 'Accommodation'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>
                            {booking.room?.roomType || 'Standard'} Room (Sharing)
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
                              : 'Not specified'}
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Token (₹{booking.pg?.bookingTokenAmount || 1000})</span>
                        </Link>
                      ) : (
                        <Link
                          to="/tenant/bookings"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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

          {/* Quick Payment History Strip (if any payments exist) */}
          {payments.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h2>
                    <p className="text-[11px] text-slate-500">
                      Razorpay online token deposits verified for your bookings
                    </p>
                  </div>
                </div>
                <Link
                  to="/tenant/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <span>View All Receipts &rarr;</span>
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
                        {payment.pg?.title || 'PG Booking Token'}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Order #{payment.razorpayOrderId} &bull;{' '}
                        {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm">
                        ₹{(payment.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold uppercase">
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
