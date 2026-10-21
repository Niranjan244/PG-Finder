import PG from '../models/PG.js';
import Room from '../models/Room.js';

export const createOwnerPG = async (ownerId, data) => {
  const { longitude, latitude, ...rest } = data;

  const pg = await PG.create({
    ...rest,
    owner: ownerId,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    status: 'pending', // Always initialized as pending for admin approval
  });

  return pg;
};

export const getOwnerPGs = async (ownerId) => {
  const listings = await PG.find({ owner: ownerId }).sort({ createdAt: -1 });

  // Compute room and occupancy summary for each PG
  const enrichedListings = await Promise.all(
    listings.map(async (pg) => {
      const rooms = await Room.find({ pg: pg._id });

      let totalBeds = 0;
      let occupiedBeds = 0;
      let minRent = 0;
      let maxRent = 0;

      if (rooms.length > 0) {
        totalBeds = rooms.reduce((sum, room) => sum + room.totalBeds, 0);
        occupiedBeds = rooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
        const rents = rooms.map((room) => room.rent);
        minRent = Math.min(...rents);
        maxRent = Math.max(...rents);
      }

      return {
        ...pg.toObject(),
        roomSummary: {
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: Math.max(0, totalBeds - occupiedBeds),
          minRent,
          maxRent,
        },
      };
    })
  );

  return enrichedListings;
};

export const getOwnerPGById = async (ownerId, pgId, userRole = 'owner') => {
  const pg = await PG.findById(pgId);

  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (pg.owner.toString() !== ownerId.toString() && userRole !== 'admin') {
    const error = new Error('Access denied: You are not authorized to view or manage this listing');
    error.statusCode = 403;
    throw error;
  }

  const rooms = await Room.find({ pg: pgId }).sort({ rent: 1 });

  return { pg, rooms };
};

export const updateOwnerPG = async (ownerId, pgId, data, userRole = 'owner') => {
  const pg = await PG.findById(pgId);

  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (pg.owner.toString() !== ownerId.toString() && userRole !== 'admin') {
    const error = new Error('Access denied: You are not authorized to modify this listing');
    error.statusCode = 403;
    throw error;
  }

  const { longitude, latitude, ...rest } = data;

  if (longitude !== undefined && latitude !== undefined) {
    pg.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }

  Object.assign(pg, rest);

  // Edited listings must be re-verified by administrator
  pg.status = 'pending';

  await pg.save();
  return pg;
};

export const deleteOwnerPG = async (ownerId, pgId, userRole = 'owner') => {
  const pg = await PG.findById(pgId);

  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (pg.owner.toString() !== ownerId.toString() && userRole !== 'admin') {
    const error = new Error('Access denied: You are not authorized to delete this listing');
    error.statusCode = 403;
    throw error;
  }

  // Cascade delete all associated rooms
  await Room.deleteMany({ pg: pgId });
  await PG.findByIdAndDelete(pgId);

  return { deletedPGId: pgId };
};

export const getPublicPGDetails = async (pgId, requestingUserId = null, userRole = null) => {
  const pg = await PG.findById(pgId).populate('owner', 'name email phone');

  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  // If listing is not yet approved, only the owner or an admin can preview it
  const isOwner = requestingUserId && pg.owner._id.toString() === requestingUserId.toString();
  const isAdmin = userRole === 'admin';

  if (pg.status !== 'approved' && !isOwner && !isAdmin) {
    const error = new Error('This PG listing is currently undergoing verification and is not yet publicly visible');
    error.statusCode = 403;
    throw error;
  }

  const rooms = await Room.find({ pg: pgId }).sort({ rent: 1 });

  return { pg, rooms, isPreview: pg.status !== 'approved' };
};
