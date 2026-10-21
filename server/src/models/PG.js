import mongoose from 'mongoose';

const pgSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'PG listing must belong to an owner'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Locality/Area is required'],
      trim: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Geographical coordinates [longitude, latitude] are required'],
      },
    },
    genderPreference: {
      type: String,
      enum: {
        values: ['boys', 'girls', 'coliving'],
        message: 'Gender preference must be boys, girls, or coliving',
      },
      required: [true, 'Gender preference is required'],
      index: true,
    },
    rentRange: {
      minRent: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxRent: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    deposit: {
      type: Number,
      required: [true, 'Security deposit amount is required'],
      min: [0, 'Deposit cannot be negative'],
      default: 0,
    },
    foodDetails: {
      available: {
        type: Boolean,
        default: false,
      },
      mealTypes: {
        type: [String],
        default: [],
      },
      isPureVeg: {
        type: Boolean,
        default: false,
      },
    },
    wifi: {
      type: Boolean,
      default: false,
    },
    amenities: {
      type: [String],
      default: [],
    },
    rules: {
      type: [String],
      default: [],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected',
      },
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial proximity searches
pgSchema.index({ location: '2dsphere' });

// Text search index for full-text search across titles, locations, and descriptions
pgSchema.index(
  {
    title: 'text',
    area: 'text',
    city: 'text',
    address: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      area: 5,
      city: 5,
      address: 2,
      description: 1,
    },
    name: 'PGTextSearchIndex',
  }
);

// Compound indexes for high-speed filter & sort execution
pgSchema.index({ status: 1, 'rentRange.minRent': 1 });
pgSchema.index({ status: 1, 'rentRange.maxRent': 1 });
pgSchema.index({ status: 1, genderPreference: 1 });
pgSchema.index({ status: 1, averageRating: -1 });
pgSchema.index({ status: 1, createdAt: -1 });
pgSchema.index({ city: 1, area: 1, status: 1 });

export const PG = mongoose.model('PG', pgSchema);
export default PG;
