import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyBookingsApi, cancelBookingApi } from '../../services/bookingClient.js';
import { createPaymentOrderApi, verifyPaymentApi } from '../../services/paymentClient.js';
import { loadRazorpayScript } from '../../utils/loadRazorpay.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import {
  Building2,
  Calendar,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Ban,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  RefreshCw,
} from 'lucide-react';

export const TenantBookingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Payment state
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [statusAlert, setStatusAlert] = useState(null);

  const { data: bookingsData, isLoading, isError, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookingsApi,
  });

  const bookings = bookingsData?.data || [];

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }) => cancelBookingApi(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setIsCancelModalOpen(false);
      setCancellingBooking(null);
      setCancelReason('');
      setStatusAlert({
        type: 'info',
        title: 'Booking Cancelled',
        message: 'Your booking request was cancelled. If a token was paid, an automatic refund has been initiated.',
      });
    },
  });

  const handleOpenCancel = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    cancelMutation.mutate({
      bookingId: cancellingBooking._id,
      reason: cancelReason,
    });
  };

  const handlePayToken = async (booking) => {
    setStatusAlert(null);
    setPayingBookingId(booking._id);

    try {
      // 1. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
      }

      // 2. Request Razorpay order from backend
      const res = await createPaymentOrderApi(booking._id);
      const orderData = res.data;

      // 3. Configure Razorpay Checkout
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'PG Finder',
        description: `Booking Token: ${booking.pg?.title || 'Accommodation'}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#026fc7',
        },
        modal: {
          ondismiss: () => {
            setPayingBookingId(null);
            setStatusAlert({
              type: 'info',
              title: 'Checkout Closed',
              message: 'Payment was not completed. You can retry whenever you are ready before the hold expires.',
            });
          },
        },
        handler: async (response) => {
          try {
            setPayingBookingId(booking._id);
            // 4. Verify cryptographic signature on backend
            await verifyPaymentApi({
              bookingId: booking._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Update UI list without full page reload
            await queryClient.invalidateQueries({ queryKey: ['myBookings'] });
            setPayingBookingId(null);
            setStatusAlert({
              type: 'success',
              title: 'Payment Confirmed & Bed Reserved!',
              message: `Payment of ₹${orderData.amount} verified successfully (Payment ID: ${response.razorpay_payment_id}). Your stay is officially confirmed!`,
            });
          } catch (verifyErr) {
            setPayingBookingId(null);
            setStatusAlert({
              type: 'error',
              title: 'Verification Failed',
              message:
                verifyErr.message ||
                'Payment signature verification failed. If your account was charged, the system webhook will confirm your booking shortly.',
            });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failResponse) => {
        setPayingBookingId(null);
        setStatusAlert({
          type: 'error',
          title: 'Payment Failed',
          message: failResponse.error?.description || 'The transaction was declined by your bank or card provider.',
        });
      });

      rzp.open();
    } catch (err) {
      setPayingBookingId(null);
      setStatusAlert({
        type: 'error',
        title: 'Checkout Error',
        message: err.message || 'Unable to open payment checkout.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            My Booking Requests
          </h1>
          <p className="mt-1 text-xs text-theme-secondary">
            Track your room requests, pay booking tokens online, and coordinate move-in dates with property owners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tenant/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5 text-theme-brand" />
            <span>Payment History</span>
          </Link>

          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
          >
            <span>Find More PGs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusAlert && (
        <div
          className={`rounded-2xl border p-4 flex items-start justify-between gap-3 text-xs animate-in fade-in transition-all ${
            statusAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : statusAlert.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusAlert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusAlert.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{statusAlert.title}</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{statusAlert.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusAlert(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading your booking requests...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
          <p className="font-semibold">Unable to load booking requests.</p>
          <p className="mt-1">{error?.response?.data?.message || error?.message || 'Server error'}</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-theme-primary">No Booking Requests</h3>
          <p className="mt-1.5 text-xs text-theme-secondary max-w-sm mx-auto">
            You haven't requested any PG accommodations yet. Explore verified listings, choose your desired room type, and send a booking request.
          </p>
          <div className="mt-6">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <span>Explore Accommodations</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-4">
          {bookings.map((booking) => {
            const pg = booking.pg || {};
            const room = booking.room || {};
            const owner = booking.owner || {};
            const primaryImage = pg.images?.[0]?.url;
            const tokenAmount = pg.bookingTokenAmount || 1000;
            const isApproved = booking.status === 'approved';
            const isConfirmed = booking.status === 'confirmed' || booking.paymentStatus === 'paid';
            const canCancel = ['pending', 'approved', 'confirmed'].includes(booking.status);
            const isPayingThis = payingBookingId === booking._id;

            return (
              <div
                key={booking._id}
                className="overflow-hidden rounded-2xl border border-theme-border bg-theme-surface p-5 shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Property Info */}
                  <div className="flex gap-4">
                    <div className="h-20 w-24 sm:h-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-theme-surface-hover border border-theme-border">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={pg.title || 'PG Image'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-theme-muted">
                          <Building2 className="h-8 w-8 stroke-[1.5]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/pg/${pg._id}`}
                          className="text-sm font-bold text-theme-primary hover:text-theme-brand transition-colors line-clamp-1"
                        >
                          {pg.title || 'PG Accommodation'}
                        </Link>
                        <BookingStatusBadge
                          status={booking.status}
                          paymentStatus={booking.paymentStatus}
                        />
                      </div>

                      <p className="text-xs text-theme-secondary">
                        {pg.area}, {pg.city}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-theme-secondary pt-1">
                        <span>
                          Room <strong className="text-theme-primary">{room.roomNumber}</strong> ({room.roomType})
                        </span>
                        <span>&bull;</span>
                        <span>
                          Rent: <strong className="text-theme-primary">₹{room.rent?.toLocaleString()}/mo</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Cancel */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-theme-border">
                    <div className="text-right">
                      <span className="text-[11px] text-theme-muted block">Requested on</span>
                      <span className="text-xs font-medium text-theme-secondary">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancel(booking)}
                        className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs font-semibold text-theme-secondary hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors"
                      >
                        <Ban className="h-3 w-3" />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-theme-border text-xs">
                  <div className="flex items-center gap-2 text-theme-secondary">
                    <Calendar className="h-4 w-4 text-theme-muted shrink-0" />
                    <span>
                      Target Move-In:{' '}
                      <strong className="text-theme-primary">
                        {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>

                  {booking.message && (
                    <div className="sm:col-span-2 text-theme-muted italic line-clamp-1">
                      "{booking.message}"
                    </div>
                  )}
                </div>

                {/* APPROVED BUT UNPAID: Razorpay Payment CTA Box */}
                {isApproved && booking.paymentStatus !== 'paid' && (
                  <div className="rounded-2xl border border-brand-200 bg-brand-50/70 dark:bg-brand-950/30 dark:border-brand-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Owner Approved &bull; Pay Token to Confirm Bed
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Pay the refundable booking token of{' '}
                        <strong className="text-slate-900 dark:text-white font-bold text-sm">
                          ₹{tokenAmount.toLocaleString()}
                        </strong>{' '}
                        through Razorpay to lock your bed reservation.
                      </p>
                      {booking.holdExpiresAt && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            Bed hold expires on{' '}
                            {new Date(booking.holdExpiresAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isPayingThis}
                      onClick={() => handlePayToken(booking)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-brand px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-theme-brand-hover transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isPayingThis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Opening Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Pay Booking Token (₹{tokenAmount.toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* CONFIRMED & PAID: Token Receipt Box & Contact Details */}
                {isConfirmed && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 space-y-3 text-xs text-emerald-950 dark:text-emerald-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold text-emerald-900 dark:text-emerald-300">
                          Bed Confirmed &bull; Token Paid (₹{booking.payment?.amount || tokenAmount})
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono">
                        {booking.payment?.razorpayPaymentId ? `ID: ${booking.payment.razorpayPaymentId}` : 'Payment Verified'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        Contact the property manager to coordinate check-in and room key collection:
                      </span>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        {owner.phone && (
                          <a
                            href={`tel:${owner.phone}`}
                            className="inline-flex items-center gap-1.5 hover:underline text-emerald-900 dark:text-emerald-300"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>{owner.phone}</span>
                          </a>
                        )}
                        {owner.email && (
                          <a
                            href={`mailto:${owner.email}`}
                            className="inline-flex items-center gap-1.5 hover:underline text-emerald-900 dark:text-emerald-300"
                          >
                            <Mail className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>{owner.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Note */}
                {booking.status === 'rejected' && booking.rejectionReason && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
                    <span className="font-semibold">Reason from owner: </span>
                    <span>{booking.rejectionReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-theme-surface p-6 shadow-xl border border-theme-border space-y-4">
            <h3 className="text-sm font-bold text-theme-primary">Cancel Booking</h3>
            <p className="text-xs text-theme-secondary leading-relaxed">
              Are you sure you want to cancel this booking?
              {cancellingBooking.paymentStatus === 'paid' ? (
                <span className="block mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  Your booking token will be automatically refunded through Razorpay to your original payment method.
                </span>
              ) : (
                <span className="block mt-1">
                  The reserved bed will be released back to the room inventory.
                </span>
              )}
            </p>

            <div>
              <label htmlFor="cancel-reason" className="block text-[11px] font-semibold text-theme-secondary mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancel-reason"
                rows={2}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="e.g. Schedule changed, found another accommodation..."
                className="w-full rounded-lg border border-theme-border p-2 text-xs text-theme-primary bg-theme-surface focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand"
              />
            </div>

            {cancelMutation.isError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {cancelMutation.error?.response?.data?.message || 'Failed to cancel request'}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantBookingsPage;
