import { Types } from 'mongoose';
import { DownloadJob, IDownloadJobDocument } from '../models/downloadJob.model.js';
import { User } from '../models/user.model.js';
import { QueueService } from './queue.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CreateDownloadJobInput } from '../schemas/download.schema.js';

export class DownloadService {
  private static userMaxStorageBytes = 2 * 1024 * 1024 * 1024; // 2 GB free quota
  private static maxActiveJobsPerUser = 3;

  public static async createJob(
    userId: string,
    input: CreateDownloadJobInput
  ): Promise<IDownloadJobDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    // 1. Enforce user storage quota
    if (user.storageUsageBytes >= this.userMaxStorageBytes) {
      throw new AppError(
        'Storage quota exceeded (2 GB limit). Please delete existing files to continue downloading.',
        403,
        'STORAGE_QUOTA_EXCEEDED'
      );
    }

    // 2. Enforce active concurrent downloads per user
    const activeJobs = await DownloadJob.countDocuments({
      userId,
      status: { $in: ['pending', 'queued', 'processing', 'downloading'] },
    });

    if (activeJobs >= this.maxActiveJobsPerUser) {
      throw new AppError(
        `Concurrency limit reached. You can run at most ${this.maxActiveJobsPerUser} active downloads simultaneously.`,
        429,
        'CONCURRENCY_LIMIT_EXCEEDED'
      );
    }

    // 3. Create job document
    const job = await DownloadJob.create({
      userId: new Types.ObjectId(userId),
      source: input.source || 'direct',
      originalUrl: input.url,
      mediaInfo: {
        title: input.mediaInfo?.title || 'Media Download',
        thumbnail: input.mediaInfo?.thumbnail,
        duration: input.mediaInfo?.duration,
        creator: input.mediaInfo?.creator,
      },
      selectedFormat: {
        container: input.format.container,
        quality: input.format.quality || 'original',
        resolution: input.format.resolution,
        audioOnly: input.format.audioOnly ?? false,
      },
      status: 'pending',
    });

    // 4. Enqueue to background worker
    await QueueService.enqueueJob(job._id.toString());

    return job;
  }

  public static async getUserJobs(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ jobs: IDownloadJobDocument[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      DownloadJob.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('resultFileId'),
      DownloadJob.countDocuments({ userId }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getJobById(jobId: string, userId: string): Promise<IDownloadJobDocument> {
    const job = await DownloadJob.findOne({ _id: jobId, userId }).populate('resultFileId');
    if (!job) {
      throw new AppError('Download job not found or access denied', 404, 'JOB_NOT_FOUND');
    }
    return job;
  }

  public static async cancelJob(jobId: string, userId: string): Promise<IDownloadJobDocument> {
    return QueueService.cancelJob(jobId, userId);
  }

  public static async retryJob(jobId: string, userId: string): Promise<IDownloadJobDocument> {
    return QueueService.retryJob(jobId, userId);
  }

  public static async deleteJob(jobId: string, userId: string): Promise<void> {
    const job = await DownloadJob.findOneAndDelete({ _id: jobId, userId });
    if (!job) {
      throw new AppError('Download job not found or access denied', 404, 'JOB_NOT_FOUND');
    }
  }
}
