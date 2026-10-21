import PG from '../models/PG.js';
import Room from '../models/Room.js';

const verifyPGOwnership = async (pgId, ownerId, userRole) => {
  const pg = await PG.findById(pgId);

  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (pg.owner.toString() !== ownerId.toString() && userRole !== 'admin') {
    const error = new Error('Access denied: You are not authorized to manage rooms for this listing');
    error.statusCode = 403;
    throw error;
  }

  return pg;
};

const syncPGRentRange = async (pgId) => {
  const rooms = await Room.find({ pg: pgId });
  if (rooms.length === 0) {
    await PG.findByIdAndUpdate(pgId, {
      rentRange: { minRent: 0, maxRent: 0 },
    });
    return;
  }

  const rents = rooms.map((room) => room.rent);
  await PG.findByIdAndUpdate(pgId, {
    rentRange: {
      minRent: Math.min(...rents),
      maxRent: Math.max(...rents),
    },
  });
};

export const addRoomToPG = async (ownerId, pgId, roomData, userRole = 'owner') => {
  await verifyPGOwnership(pgId, ownerId, userRole);

  const room = await Room.create({
    ...roomData,
    pg: pgId,
  });

  await syncPGRentRange(pgId);
  return room;
};

export const updateRoom = async (ownerId, pgId, roomId, roomData, userRole = 'owner') => {
  await verifyPGOwnership(pgId, ownerId, userRole);

  const room = await Room.findOne({ _id: roomId, pg: pgId });

  if (!room) {
    const error = new Error('Room record not found for this accommodation');
    error.statusCode = 404;
    throw error;
  }

  Object.assign(room, roomData);
  await room.save();

  await syncPGRentRange(pgId);
  return room;
};

export const deleteRoom = async (ownerId, pgId, roomId, userRole = 'owner') => {
  await verifyPGOwnership(pgId, ownerId, userRole);

  const room = await Room.findOneAndDelete({ _id: roomId, pg: pgId });

  if (!room) {
    const error = new Error('Room record not found');
    error.statusCode = 404;
    throw error;
  }

  await syncPGRentRange(pgId);
  return { deletedRoomId: roomId };
};
