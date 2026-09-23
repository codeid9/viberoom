import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
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
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Room = model<IRoom>('Room', roomSchema);
export default Room;