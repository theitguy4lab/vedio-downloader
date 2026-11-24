import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ISessionDocument extends Omit<ISession, '_id'>, Document {}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-expire sessions
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Session: Model<ISessionDocument> = mongoose.model<ISessionDocument>('Session', sessionSchema);
