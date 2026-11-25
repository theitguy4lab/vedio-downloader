import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMediaFile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  title: string;
  originalFilename: string;
  storageKey: string;
  container: string;
  mimeType: string;
  fileSizeBytes: number;
  duration?: number;
  thumbnailPath?: string;
  isDeleted: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaFileDocument extends Omit<IMediaFile, '_id'>, Document {}

const mediaFileSchema = new Schema<IMediaFileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'DownloadJob',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    container: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      default: 0,
    },
    duration: {
      type: Number,
    },
    thumbnailPath: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

mediaFileSchema.index({ userId: 1, createdAt: -1 });

export const MediaFile: Model<IMediaFileDocument> = mongoose.model<IMediaFileDocument>(
  'MediaFile',
  mediaFileSchema
);
