import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBookingApi } from '../../services/bookingClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { X, Calendar, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const BookingModal = ({ pg, rooms = [], selectedRoom = null, isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isTenant = user?.role === 'tenant';
  const [roomId, setRoomId] = useState(selectedRoom?._id || rooms[0]?._id || '');
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync selectedRoom if modal opens with a specific room
  React.useEffect(() => {
    if (selectedRoom?._id) {
      setRoomId(selectedRoom._id);
    } else if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0]._id);
    }
  }, [selectedRoom, rooms]);

  // Today's date in YYYY-MM-DD for min date attribute
  const todayStr = new Date().toISOString().split('T')[0];

  const currentRoom = rooms.find((room) => room._id === roomId) || selectedRoom;
  const isRoomFull = currentRoom && currentRoom.occupiedBeds >= currentRoom.totalBeds;

  const mutation = useMutation({
    mutationFn: createBookingApi,
    onSuccess: () => {
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPG', pg?._id] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId) return;
    if (!moveInDate) return;

    mutation.mutate({
      pgId: pg._id,
      roomId,
      moveInDate,
      message,
    });
  };

  const handleClose = () => {
    setSubmitSuccess(false);
    mutation.reset();
    setMessage('');
    setMoveInDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-theme-surface shadow-xl overflow-hidden border border-theme-border transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-theme-primary">Request Booking</h3>
            <p className="text-xs text-theme-muted mt-0.5 line-clamp-1">{pg?.title}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-theme-primary">Booking Request Sent</h4>
            <p className="text-xs text-theme-secondary max-w-sm mx-auto leading-relaxed">
              Your request for <span className="font-semibold text-theme-primary">{pg?.title}</span> has been submitted to the owner for review. You can track its live status in your dashboard.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-theme-secondary">
            {!isTenant && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-semibold">Tenant Account Required</span>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    You are signed in as an <strong>{user?.role || 'owner'}</strong>. Booking requests can only be sent from accounts registered as <strong>Tenant</strong>.
                  </p>
                </div>
              </div>
            )}
            {mutation.isError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3 text-theme-error">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-theme-error" />
                <div>
                  <span className="font-semibold">{mutation.error?.message || 'Failed to submit booking request'}</span>
                  {mutation.error?.errors && Array.isArray(mutation.error.errors) && (
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                      {mutation.error.errors.map((e, idx) => (
                        <li key={idx}>{e.message || `${e.field}: invalid`}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Room Selection */}
            <div>
              <label htmlFor="booking-room" className="block font-semibold text-theme-secondary mb-1">
                Select Room & Sharing Type
              </label>
              <select
                id="booking-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-theme-border bg-theme-surface py-2 px-3 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
              >
                {rooms.map((room, idx) => {
                  const available = Math.max(0, (room.totalBeds || 1) - (room.occupiedBeds || 0));
                  const label = room.roomNumber ? `Room ${room.roomNumber}` : `Room ${idx + 1}`;
                  return (
                    <option key={room._id} value={room._id} disabled={available === 0} className="bg-theme-surface text-theme-primary">
                      {label} ({room.roomType}) - ₹{room.rent?.toLocaleString()}/mo {available === 0 ? '[FULL]' : `[${available} beds available]`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Move-in Date */}
            <div>
              <label htmlFor="booking-date" className="block font-semibold text-theme-secondary mb-1">
                Target Move-In Date
              </label>
              <div className="relative">
                <input
                  id="booking-date"
                  type="date"
                  min={todayStr}
                  required
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-surface py-2 pl-9 pr-3 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                />
                <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-theme-muted" />
              </div>
            </div>

            {/* Message to Owner */}
            <div>
              <label htmlFor="booking-msg" className="block font-semibold text-theme-secondary mb-1">
                Note for Property Owner (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="booking-msg"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the owner a bit about yourself (e.g. college student, software engineer, duration of stay)..."
                  className="w-full rounded-lg border border-theme-border bg-theme-surface p-2.5 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                  maxLength={500}
                />
              </div>
              <span className="text-[10px] text-theme-muted block text-right">{message.length}/500</span>
            </div>

            {/* Pricing Summary */}
            {currentRoom && (
              <div className="rounded-xl bg-theme-surface-hover border border-theme-border p-3 space-y-1.5 text-theme-secondary transition-colors">
                <div className="flex justify-between">
                  <span>Monthly Room Rent</span>
                  <span className="font-semibold text-theme-primary">₹{currentRoom.rent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Security Deposit</span>
                  <span className="font-semibold text-theme-primary">₹{pg?.deposit?.toLocaleString() || 0}</span>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-border">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isTenant || mutation.isPending || isRoomFull || !roomId || !moveInDate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover disabled:opacity-50 transition-colors"
              >
                {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{mutation.isPending ? 'Submitting...' : 'Send Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
