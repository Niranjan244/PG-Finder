import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchOwnerListingById,
  addRoomApi,
  updateRoomApi,
  deleteRoomApi,
} from '../../services/pgClient.js';
import {
  BedDouble,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Eye,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

const roomSchema = z.object({
  roomNumber: z.string().trim().optional().default(''),
  roomType: z.enum(['single', 'double', 'triple', 'four_sharing']),
  rent: z.coerce.number().min(0, 'Rent cannot be negative'),
  totalBeds: z.coerce.number().int().min(1, 'Must have at least 1 bed'),
  occupiedBeds: z.coerce.number().int().min(0, 'Occupied beds cannot be negative').default(0),
}).refine((data) => data.occupiedBeds <= data.totalBeds, {
  message: 'Occupied beds cannot exceed total beds in room',
  path: ['occupiedBeds'],
});

export const PGRoomsPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState('');

  const { data: pgDetailsData, isLoading, isError, error } = useQuery({
    queryKey: ['ownerPGDetails', id],
    queryFn: () => fetchOwnerListingById(id),
  });

  const pg = pgDetailsData?.data?.pg;
  const rooms = pgDetailsData?.data?.rooms || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomNumber: '',
      roomType: 'double',
      rent: 6500,
      totalBeds: 2,
      occupiedBeds: 0,
    },
  });

  const addRoomMutation = useMutation({
    mutationFn: (roomData) => addRoomApi(id, roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerPGDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerListings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPGDetails', id] });
      closeModal();
    },
    onError: (error) => {
      setFormError(error.message || 'Failed to add room');
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ roomId, roomData }) => updateRoomApi(id, roomId, roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerPGDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerListings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPGDetails', id] });
      closeModal();
    },
    onError: (error) => {
      setFormError(error.message || 'Failed to update room');
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId) => deleteRoomApi(id, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerPGDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerListings'] });
      queryClient.invalidateQueries({ queryKey: ['publicPGDetails', id] });
    },
    onError: (error) => {
      alert(error.message || 'Failed to remove room');
    },
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormError('');
    reset({
      roomNumber: '',
      roomType: 'double',
      rent: 6500,
      totalBeds: 2,
      occupiedBeds: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormError('');
    reset({
      roomNumber: room.roomNumber || '',
      roomType: room.roomType,
      rent: room.rent,
      totalBeds: room.totalBeds,
      occupiedBeds: room.occupiedBeds,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormError('');
  };

  const onSubmit = (formData) => {
    setFormError('');
    if (editingRoom) {
      updateRoomMutation.mutate({ roomId: editingRoom._id, roomData: formData });
    } else {
      addRoomMutation.mutate(formData);
    }
  };

  const handleDeleteRoom = (roomId, roomType, roomNumber) => {
    const label = roomNumber ? `Room ${roomNumber} (${roomType})` : `${roomType} sharing room`;
    if (window.confirm(`Are you sure you want to remove ${label}?`)) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  const getRoomTypeLabel = (type) => {
    switch (type) {
      case 'single':
        return 'Single Occupancy';
      case 'double':
        return 'Double Sharing (2 Beds)';
      case 'triple':
        return 'Triple Sharing (3 Beds)';
      case 'four_sharing':
        return 'Four Sharing (4 Beds)';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-theme-brand" />
      </div>
    );
  }

  if (isError || !pg) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-rose-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-theme-primary">Accommodation Unavailable</h3>
        <p className="mt-1 text-xs text-theme-muted max-w-md mx-auto">
          {error?.message || 'Unable to load room inventory for this accommodation. You might not have permission to manage this listing.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/owner/listings"
            className="rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
          >
            Return to My Listings
          </Link>
          <Link
            to="/search"
            className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover transition-colors"
          >
            Explore PGs
          </Link>
        </div>
      </div>
    );
  }

  const totalCapacity = rooms.reduce((acc, room) => acc + (room.totalBeds || 0), 0);
  const totalOccupied = rooms.reduce((acc, room) => acc + (room.occupiedBeds || 0), 0);
  const availableBeds = Math.max(0, totalCapacity - totalOccupied);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-theme-border">
        <div>
          <Link
            to="/owner/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-theme-primary mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to My Listings</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-theme-primary">{pg.title}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                pg.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {pg.status === 'approved' ? 'Approved & Live' : 'Pending Verification'}
            </span>
          </div>
          <p className="mt-1 text-xs text-theme-muted">
            {pg.area}, {pg.city} &bull; Room inventory and bed occupancy management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/pg/${pg._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-theme-muted" />
            <span>Preview Listing</span>
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Room Type</span>
          </button>
        </div>
      </div>

      {/* Capacity Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-xs transition-colors">
          <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Total Rooms</span>
          <div className="mt-2 text-2xl font-bold text-theme-primary">{rooms.length}</div>
          <p className="mt-1 text-xs text-theme-muted">Configured room units</p>
        </div>

        <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-xs transition-colors">
          <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Bed Occupancy</span>
          <div className="mt-2 text-2xl font-bold text-theme-primary">
            {totalOccupied} / {totalCapacity}
          </div>
          <p className="mt-1 text-xs text-theme-muted">Occupied beds across all rooms</p>
        </div>

        <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-xs transition-colors">
          <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Vacant Beds</span>
          <div className="mt-2 text-2xl font-bold text-emerald-500">{availableBeds}</div>
          <p className="mt-1 text-xs text-theme-muted">Ready for immediate tenant move-in</p>
        </div>
      </div>

      {/* Room Listing Table / Grid */}
      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center transition-colors">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted">
            <BedDouble className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-theme-primary">No Rooms Added Yet</h3>
          <p className="mt-1.5 text-xs text-theme-muted max-w-sm mx-auto">
            This accommodation currently has zero rooms. Add room types (e.g. Single, Double Sharing), specify monthly rents, and track bed occupancies.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Room</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, idx) => {
            const totalBeds = room.totalBeds || 1;
            const occupiedBeds = room.occupiedBeds || 0;
            const availableInRoom = Math.max(0, totalBeds - occupiedBeds);
            const occupancyPct = Math.min(100, Math.round((occupiedBeds / totalBeds) * 100));

            return (
              <div
                key={room._id}
                className="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border">
                    <div>
                      <span className="text-[11px] font-mono text-theme-muted block">
                        Room {room.roomNumber || idx + 1}
                      </span>
                      <span className="text-sm font-bold text-theme-primary">
                        {getRoomTypeLabel(room.roomType)}
                      </span>
                    </div>
                    <span className="rounded bg-theme-brand-subtle px-2.5 py-1 text-xs font-bold text-theme-brand border border-theme-brand/20">
                      ₹{room.rent?.toLocaleString()} / mo
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-theme-secondary">
                      <span>Total Bed Capacity:</span>
                      <span className="font-semibold text-theme-primary">{totalBeds} Beds</span>
                    </div>

                    <div className="flex justify-between items-center text-theme-secondary">
                      <span>Occupied Beds:</span>
                      <span className="font-semibold text-theme-primary">{occupiedBeds} Beds</span>
                    </div>

                    <div className="flex justify-between items-center text-theme-secondary">
                      <span>Available for Booking:</span>
                      <span
                        className={`font-semibold ${
                          availableInRoom > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {availableInRoom > 0 ? `${availableInRoom} Beds Vacant` : 'Fully Occupied'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] text-theme-muted mb-1">
                        <span>Occupancy</span>
                        <span>{occupancyPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-theme-surface-hover overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPct >= 100 ? 'bg-rose-500' : 'bg-theme-brand'
                          }`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-theme-border flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openEditModal(room)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5 text-theme-muted" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room._id, room.roomType, room.roomNumber)}
                    disabled={deleteRoomMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-theme-surface px-3 py-1.5 font-medium text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-theme-surface p-6 shadow-xl border border-theme-border transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-theme-border">
              <h2 className="text-base font-bold text-theme-primary">
                {editingRoom ? 'Edit Room Configuration' : 'Add Room Configuration'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3 text-xs text-theme-error">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-theme-error" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                  Room Number / Label
                </label>
                <input
                  type="text"
                  {...register('roomNumber')}
                  className="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                  placeholder="e.g. 101, A-1, Ground Floor"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                  Room Sharing Type
                </label>
                <select
                  {...register('roomType')}
                  className="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                >
                  <option value="single" className="bg-theme-surface text-theme-primary">Single Occupancy (Private)</option>
                  <option value="double" className="bg-theme-surface text-theme-primary">Double Sharing (2 Beds)</option>
                  <option value="triple" className="bg-theme-surface text-theme-primary">Triple Sharing (3 Beds)</option>
                  <option value="four_sharing" className="bg-theme-surface text-theme-primary">Four Sharing (4 Beds)</option>
                </select>
                {errors.roomType && (
                  <p className="mt-1 text-theme-error">{errors.roomType.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                  Monthly Rent Per Bed (₹)
                </label>
                <input
                  type="number"
                  {...register('rent')}
                  className="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                  placeholder="e.g. 7500"
                />
                {errors.rent && <p className="mt-1 text-theme-error">{errors.rent.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                    Total Beds
                  </label>
                  <input
                    type="number"
                    {...register('totalBeds')}
                    className="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                    placeholder="2"
                  />
                  {errors.totalBeds && (
                    <p className="mt-1 text-theme-error">{errors.totalBeds.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                    Occupied Beds
                  </label>
                  <input
                    type="number"
                    {...register('occupiedBeds')}
                    className="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs text-theme-primary focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                    placeholder="0"
                  />
                  {errors.occupiedBeds && (
                    <p className="mt-1 text-theme-error">{errors.occupiedBeds.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-theme-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || addRoomMutation.isPending || updateRoomMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-4 py-2 font-semibold text-white shadow-xs hover:bg-theme-brand-hover disabled:opacity-50 transition-colors"
                >
                  {(isSubmitting || addRoomMutation.isPending || updateRoomMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>{editingRoom ? 'Update Room' : 'Add Room'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PGRoomsPage;
