import { addRoomToPG, updateRoom, deleteRoom } from '../services/roomService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createRoom = async (req, res, next) => {
  try {
    const room = await addRoomToPG(req.user._id, req.params.id, req.body, req.user.role);
    return sendSuccess(res, 201, 'Room added to accommodation', { room });
  } catch (error) {
    next(error);
  }
};

export const updateRoomDetails = async (req, res, next) => {
  try {
    const room = await updateRoom(req.user._id, req.params.id, req.params.roomId, req.body, req.user.role);
    return sendSuccess(res, 200, 'Room details updated', { room });
  } catch (error) {
    next(error);
  }
};

export const removeRoom = async (req, res, next) => {
  try {
    const result = await deleteRoom(req.user._id, req.params.id, req.params.roomId, req.user.role);
    return sendSuccess(res, 200, 'Room removed from accommodation', result);
  } catch (error) {
    next(error);
  }
};
