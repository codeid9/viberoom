import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: String,
      required: [true, 'roomId is required'],
      index: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: [true, 'senderName is required'],
      trim: true,
      minlength: [1, 'senderName must be at least 1 character long'],
      maxlength: [30, 'senderName cannot exceed 30 characters'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message content cannot be empty'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Message = model<IMessage>('Message', messageSchema);
export default Message;