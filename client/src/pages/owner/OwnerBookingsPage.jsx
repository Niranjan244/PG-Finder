import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  getOwnerBookingsApi,
  approveBookingApi,
  rejectBookingApi,
} from '../../services/bookingClient.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  Inbox,
  Calendar,
  Phone,
  Mail,
  Check,
  X,
  AlertCircle,
  Loader2,
  CreditCard,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const OwnerBookingsPage = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [rejectingBookingId, setRejectingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: bookingsData, isLoading, isError, error } = useQuery({
    queryKey: ['ownerBookings', selectedStatus],
    queryFn: () =>
      getOwnerBookingsApi(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
  });

  const bookings = bookingsData?.data?.bookings || [];

  const approveMutation = useMutation({
    mutationFn: (bookingId) => approveBookingApi(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      setActionError('');
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || error?.message || 'Failed to approve booking');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ bookingId, reason }) => rejectBookingApi(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      setRejectingBookingId(null);
      setRejectionReason('');
      setActionError('');
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || error?.message || 'Failed to reject booking');
    },
  });

  const handleOpenReject = (bookingId) => {
    setRejectingBookingId(bookingId);
    setRejectionReason('');
    setActionError('');
  };

  const handleConfirmReject = () => {
    if (!rejectingBookingId) return;
    rejectMutation.mutate({
      bookingId: rejectingBookingId,
      reason: rejectionReason,
    });
  };

  const statusTabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'approved', label: 'Approved (Unpaid)' },
    { id: 'confirmed', label: 'Confirmed & Paid' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Tenant Booking Requests"
        description="Review incoming tenant applications, verify move-in dates, approve bed holds, and track online token deposits."
        badge={`${bookings.length} Applications`}
        actions={
          <Link
            to="/owner/payments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
          >
            <CreditCard className="h-3.5 w-3.5 text-theme-brand" />
            <span>Received Tokens</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {actionError && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-theme-border">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`whitespace-nowrap px-3.5 py-2 font-semibold border-b-2 transition-all ${
              selectedStatus === tab.id
                ? 'border-theme-brand text-theme-brand'
                : 'border-transparent text-theme-muted hover:text-theme-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading booking requests...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-6 text-center text-xs text-rose-700 dark:text-rose-300">
          <p className="font-semibold text-sm">Unable to fetch booking requests.</p>
          <p className="mt-1">{error?.response?.data?.message || error?.message || 'Server error'}</p>
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`No ${selectedStatus !== 'all' ? selectedStatus : ''} Booking Requests`}
          description={
            selectedStatus === 'all'
              ? 'You have not received any booking requests from prospective tenants yet.'
              : `There are currently no booking requests with '${selectedStatus}' status.`
          }
        />
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {bookings.map((booking) => {
            const tenant = booking.tenant || {};
            const pg = booking.pg || {};
            const room = booking.room || {};
            const availableBeds = Math.max(0, (room.totalBeds || 0) - (room.occupiedBeds || 0));
            const isFull = availableBeds === 0;
            const isPending = booking.status === 'pending';

            return (
              <div
                key={booking._id}
                className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xs space-y-4 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Tenant & Property Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs">
                          {tenant.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-theme-primary">{tenant.name || 'Tenant'}</h3>
                          <div className="flex items-center gap-3 text-xs text-theme-muted">
                            {tenant.phone && (
                              <a href={`tel:${tenant.phone}`} className="inline-flex items-center gap-1 hover:underline">
                                <Phone className="h-3 w-3" />
                                <span>{tenant.phone}</span>
                              </a>
                            )}
                            {tenant.email && (
                              <a href={`mailto:${tenant.email}`} className="inline-flex items-center gap-1 hover:underline">
                                <Mail className="h-3 w-3" />
                                <span>{tenant.email}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <BookingStatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
                    </div>

                    {/* Paid Token Highlight */}
                    {(booking.status === 'confirmed' || booking.paymentStatus === 'paid') && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-bold">
                            Booking Token Deposited &bull; ₹{booking.payment?.amount || booking.pg?.bookingTokenAmount || 1000} Received
                          </span>
                        </div>
                        {booking.payment?.razorpayPaymentId && (
                          <span className="text-[11px] font-mono opacity-90">
                            Ref: {booking.payment.razorpayPaymentId}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Accommodation info */}
                    <div className="rounded-lg bg-theme-surface-subtle border border-theme-border p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-theme-secondary">
                      <div>
                        <span className="text-[11px] text-theme-muted block">Property</span>
                        <span className="font-semibold text-theme-primary line-clamp-1">{pg.title}</span>
                        <span className="text-[11px] text-theme-muted">{pg.area}, {pg.city}</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-theme-muted block">Requested Room</span>
                        <span className="font-semibold text-theme-primary">
                          Room {room.roomNumber} ({room.roomType})
                        </span>
                        <span className="text-[11px] text-theme-muted block">
                          ₹{room.rent?.toLocaleString()}/mo
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-theme-muted block">Live Capacity</span>
                        <span className="font-semibold text-theme-primary">
                          {room.occupiedBeds || 0} / {room.totalBeds || 0} Beds Occupied
                        </span>
                        <span
                          className={`text-[11px] font-semibold block ${
                            isFull ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isFull ? 'Room Full' : `${availableBeds} beds available`}
                        </span>
                      </div>
                    </div>

                    {/* Move-in and note */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-theme-secondary pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-theme-primary">
                        <Calendar className="h-3.5 w-3.5 text-theme-muted" />
                        <span>
                          Target Move-In: {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {booking.message && (
                        <div className="text-theme-muted italic line-clamp-1">
                          Tenant note: "{booking.message}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  {isPending && (
                    <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-theme-border">
                      <button
                        type="button"
                        onClick={() => approveMutation.mutate(booking._id)}
                        disabled={approveMutation.isPending || isFull}
                        title={isFull ? 'Room is already full' : 'Approve booking request'}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>{isFull ? 'Room Full' : 'Approve Request'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReject(booking._id)}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit status note */}
                {booking.status === 'rejected' && booking.rejectionReason && (
                  <div className="rounded-lg bg-theme-surface-subtle border border-theme-border p-2.5 text-xs text-theme-secondary">
                    <span className="font-semibold text-theme-primary">Decline reason: </span>
                    <span>{booking.rejectionReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-theme-surface p-6 shadow-xl border border-theme-border space-y-4">
            <h3 className="text-sm font-bold text-theme-primary">Decline Booking Request</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Provide an optional explanation to the tenant (e.g. room reserved offline, gender mismatch, lease duration).
            </p>

            <div>
              <label htmlFor="owner-reject-reason" className="block text-[11px] font-semibold text-theme-secondary mb-1">
                Reason (optional)
              </label>
              <textarea
                id="owner-reject-reason"
                rows={3}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="e.g. Room booked by another tenant offline..."
                className="w-full rounded-lg border border-theme-border bg-theme-surface p-2 text-xs text-theme-primary focus:border-theme-brand focus:outline-hidden"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
              <button
                type="button"
                onClick={() => setRejectingBookingId(null)}
                className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rejectMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsPage;
