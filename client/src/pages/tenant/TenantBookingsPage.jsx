import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyBookingsApi, cancelBookingApi } from '../../services/bookingClient.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import {
  Building2,
  Calendar,
  Phone,
  Mail,
  Loader2,
  ArrowRight,
  Ban,
} from 'lucide-react';

export const TenantBookingsPage = () => {
  const queryClient = useQueryClient();
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

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
      setCancellingBookingId(null);
      setCancelReason('');
    },
  });

  const handleOpenCancel = (bookingId) => {
    setCancellingBookingId(bookingId);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancellingBookingId) return;
    cancelMutation.mutate({
      bookingId: cancellingBookingId,
      reason: cancelReason,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Booking Requests
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Track the status of your room requests and coordinate move-in dates with property owners.
          </p>
        </div>

        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors w-fit"
        >
          <span>Find More PGs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span>Loading your booking requests...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          <p className="font-semibold">Unable to load booking requests.</p>
          <p className="mt-1">{error?.response?.data?.message || error?.message || 'Server error'}</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No Booking Requests</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            You haven't requested any PG accommodations yet. Explore verified listings, choose your desired room type, and send a booking request.
          </p>
          <div className="mt-6">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
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
            const canCancel = booking.status === 'pending' || booking.status === 'approved';

            return (
              <div
                key={booking._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Property Info */}
                  <div className="flex gap-4">
                    <div className="h-20 w-24 sm:h-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={pg.title || 'PG Image'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Building2 className="h-8 w-8 stroke-[1.5]" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/pg/${pg._id}`}
                          className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                        >
                          {pg.title || 'PG Accommodation'}
                        </Link>
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <p className="text-xs text-slate-500">
                        {pg.area}, {pg.city}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                        <span>
                          Room <strong className="text-slate-800">{room.roomNumber}</strong> ({room.roomType})
                        </span>
                        <span>&bull;</span>
                        <span>
                          Rent: <strong className="text-slate-800">₹{room.rent?.toLocaleString()}/mo</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Cancel */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Requested on</span>
                      <span className="text-xs font-medium text-slate-600">
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
                        onClick={() => handleOpenCancel(booking._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                      >
                        <Ban className="h-3 w-3" />
                        <span>Cancel Request</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      Target Move-In:{' '}
                      <strong className="text-slate-800">
                        {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </span>
                  </div>

                  {booking.message && (
                    <div className="sm:col-span-2 text-slate-500 italic line-clamp-1">
                      "{booking.message}"
                    </div>
                  )}
                </div>

                {/* Rejection Note */}
                {booking.status === 'rejected' && booking.rejectionReason && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                    <span className="font-semibold">Reason from owner: </span>
                    <span>{booking.rejectionReason}</span>
                  </div>
                )}

                {/* Owner Contact (Disclosed once approved) */}
                {booking.status === 'approved' && (
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                    <div>
                      <span className="font-bold text-emerald-900 block">Booking Approved by Owner</span>
                      <span className="text-[11px] text-emerald-800">
                        You can now reach out to the owner to finalize deposit payment and keys handoff.
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-emerald-900">
                      {owner.phone && (
                        <a
                          href={`tel:${owner.phone}`}
                          className="inline-flex items-center gap-1.5 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-700" />
                          <span>{owner.phone}</span>
                        </a>
                      )}
                      {owner.email && (
                        <a
                          href={`mailto:${owner.email}`}
                          className="inline-flex items-center gap-1.5 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5 text-emerald-700" />
                          <span>{owner.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cancel Booking Request</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this booking request? If approved, the reserved bed will be released back for other tenants.
            </p>

            <div>
              <label htmlFor="cancel-reason" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancel-reason"
                rows={2}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="e.g. Plans changed, found another PG..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {cancelMutation.isError && (
              <p className="text-xs text-rose-600">
                {cancelMutation.error?.response?.data?.message || 'Failed to cancel request'}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Request
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
