import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: [true, 'Room must belong to a PG accommodation'],
      index: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    roomType: {
      type: String,
      enum: {
        values: ['single', 'double', 'triple', 'four_sharing'],
        message: 'Room type must be single, double, triple, or four_sharing',
      },
      required: [true, 'Room sharing type is required'],
    },
    rent: {
      type: Number,
      required: [true, 'Monthly rent for this room type is required'],
      min: [0, 'Rent cannot be negative'],
    },
    totalBeds: {
      type: Number,
      required: [true, 'Total number of beds is required'],
      min: [1, 'Room must have at least 1 bed'],
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: [0, 'Occupied beds cannot be negative'],
      validate: {
        validator: function (val) {
          return val <= this.totalBeds;
        },
        message: 'Occupied beds cannot exceed total beds',
      },
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ pg: 1, roomType: 1 });
roomSchema.index({ roomType: 1, rent: 1 });

export const Room = mongoose.model('Room', roomSchema);
export default Room;
