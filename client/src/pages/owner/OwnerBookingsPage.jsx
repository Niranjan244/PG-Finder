import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOwnerBookingsApi,
  approveBookingApi,
  rejectBookingApi,
} from '../../services/bookingClient.js';
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge.jsx';
import {
  Inbox,
  Calendar,
  Phone,
  Mail,
  Check,
  X,
  AlertCircle,
  Loader2,
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
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Booking Requests Management
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Review incoming tenant applications, verify move-in dates, and manage room allocations.
        </p>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`whitespace-nowrap px-3.5 py-2 font-semibold border-b-2 transition-all ${
              selectedStatus === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span>Loading booking requests...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          <p className="font-semibold text-sm">Unable to fetch booking requests.</p>
          <p className="mt-1">{error?.response?.data?.message || error?.message || 'Server error'}</p>
          {(error?.status === 403 || error?.response?.status === 403 || error?.message?.includes('Insufficient permissions')) && (
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
      ) : bookings.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No {selectedStatus !== 'all' ? selectedStatus : ''} Booking Requests
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            {selectedStatus === 'all'
              ? 'You have not received any booking requests from prospective tenants yet.'
              : `There are currently no booking requests with '${selectedStatus}' status.`}
          </p>
        </div>
      ) : (
        /* Requests Grid */
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Tenant & Property Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-bold text-xs">
                          {tenant.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{tenant.name || 'Tenant'}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
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

                      <BookingStatusBadge status={booking.status} />
                    </div>

                    {/* Accommodation info */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Property</span>
                        <span className="font-semibold text-slate-800 line-clamp-1">{pg.title}</span>
                        <span className="text-[11px] text-slate-500">{pg.area}, {pg.city}</span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Requested Room</span>
                        <span className="font-semibold text-slate-800">
                          Room {room.roomNumber} ({room.roomType})
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          ₹{room.rent?.toLocaleString()}/mo
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Live Room Capacity</span>
                        <span className="font-semibold text-slate-800">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Target Move-In: {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {booking.message && (
                        <div className="text-slate-500 italic line-clamp-1">
                          Tenant note: "{booking.message}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  {isPending && (
                    <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => approveMutation.mutate(booking._id)}
                        disabled={approveMutation.isPending || isFull}
                        title={isFull ? 'Room is already full' : 'Approve booking request'}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Audit status note */}
                {booking.status === 'rejected' && booking.rejectionReason && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Decline reason: </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Decline Booking Request</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provide an optional explanation to the tenant (e.g. room reserved offline, gender mismatch, lease duration).
            </p>

            <div>
              <label htmlFor="owner-reject-reason" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                id="owner-reject-reason"
                rows={3}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="e.g. Room booked by another tenant offline..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingBookingId(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
