import { Schema, model, Document, Types } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  lastActivityAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true, // Indexed for cleanup queries
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Room = model<IRoom>('Room', roomSchema);
export default Room;