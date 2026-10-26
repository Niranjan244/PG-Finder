import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must have a tenant participant'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must have an owner participant'],
      index: true,
    },
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: [true, 'Conversation must reference a PG listing'],
      index: true,
    },
    lastMessage: {
      text: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    unreadCount: {
      tenant: {
        type: Number,
        default: 0,
        min: 0,
      },
      owner: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique canonical thread per tenant, owner, and property
conversationSchema.index({ tenant: 1, owner: 1, pg: 1 }, { unique: true });
conversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
