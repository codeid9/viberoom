import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  sessionIdHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionIdHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
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

// MongoDB TTL index: automatically deletes document when expiresAt timestamp arrives
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>('Session', sessionSchema);
export default Session;