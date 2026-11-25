import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { JobStatus } from '../types/index.js';

export interface IDownloadJob {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  source: string;
  originalUrl: string;
  mediaInfo: {
    title?: string;
    thumbnail?: string;
    duration?: number;
    creator?: string;
  };
  selectedFormat: {
    container: string;
    quality?: string;
    resolution?: string;
    audioOnly: boolean;
  };
  status: JobStatus;
  progress: {
    percentage: number;
    downloadedBytes: number;
    totalBytes?: number;
    speed?: number;
    eta?: number;
  };
  resultFileId?: Types.ObjectId;
  error?: {
    code: string;
    message: string;
  };
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDownloadJobDocument extends Omit<IDownloadJob, '_id'>, Document {}

const downloadJobSchema = new Schema<IDownloadJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      default: 'direct',
    },
    originalUrl: {
      type: String,
      required: true,
    },
    mediaInfo: {
      title: { type: String, default: 'Untitled Media' },
      thumbnail: { type: String },
      duration: { type: Number },
      creator: { type: String },
    },
    selectedFormat: {
      container: { type: String, required: true },
      quality: { type: String, default: 'original' },
      resolution: { type: String },
      audioOnly: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'queued',
        'processing',
        'downloading',
        'converting',
        'completed',
        'failed',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },
    progress: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      downloadedBytes: { type: Number, default: 0 },
      totalBytes: { type: Number },
      speed: { type: Number, default: 0 },
      eta: { type: Number, default: 0 },
    },
    resultFileId: {
      type: Schema.Types.ObjectId,
      ref: 'MediaFile',
    },
    error: {
      code: { type: String },
      message: { type: String },
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

downloadJobSchema.index({ userId: 1, createdAt: -1 });

export const DownloadJob: Model<IDownloadJobDocument> = mongoose.model<IDownloadJobDocument>(
  'DownloadJob',
  downloadJobSchema
);
