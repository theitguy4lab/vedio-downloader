import { DownloadJob, IDownloadJobDocument } from '../models/downloadJob.model.js';
import { DownloadWorker } from '../workers/download.worker.js';
import { AppError } from '../middlewares/errorHandler.js';

export class QueueService {
  private static maxConcurrency = 3;
  private static activeJobsCount = 0;
  private static waitingQueue: string[] = [];
  private static activeControllers: Map<string, AbortController> = new Map();

  /**
   * Enqueues a new download job
   */
  public static async enqueueJob(jobId: string): Promise<void> {
    const job = await DownloadJob.findById(jobId);
    if (!job) {
      throw new AppError('Download job not found', 404, 'JOB_NOT_FOUND');
    }

    job.status = 'queued';
    await job.save();

    this.waitingQueue.push(jobId);
    this.processNext();
  }

  /**
   * Cancels an active or queued job
   */
  public static async cancelJob(jobId: string, userId: string): Promise<IDownloadJobDocument> {
    const job = await DownloadJob.findOne({ _id: jobId, userId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404, 'JOB_NOT_FOUND');
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new AppError(`Cannot cancel job in '${job.status}' state`, 400, 'CANNOT_CANCEL');
    }

    // Abort active network stream if running
    const controller = this.activeControllers.get(jobId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(jobId);
    }

    // Remove from waiting queue if not yet started
    this.waitingQueue = this.waitingQueue.filter((id) => id !== jobId);

    job.status = 'cancelled';
    await job.save();

    return job;
  }

  /**
   * Retries an eligible failed job
   */
  public static async retryJob(jobId: string, userId: string): Promise<IDownloadJobDocument> {
    const job = await DownloadJob.findOne({ _id: jobId, userId });
    if (!job) {
      throw new AppError('Job not found or unauthorized', 404, 'JOB_NOT_FOUND');
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new AppError('Only failed or cancelled jobs can be retried', 400, 'INVALID_RETRY_STATE');
    }

    job.status = 'queued';
    job.retryCount += 1;
    job.error = undefined;
    job.progress = {
      percentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      eta: 0,
    };
    await job.save();

    this.waitingQueue.push(jobId);
    this.processNext();

    return job;
  }

  /**
   * Internal queue runner managing worker slots
   */
  private static async processNext(): Promise<void> {
    if (this.activeJobsCount >= this.maxConcurrency || this.waitingQueue.length === 0) {
      return;
    }

    const nextJobId = this.waitingQueue.shift();
    if (!nextJobId) return;

    this.activeJobsCount++;
    const controller = new AbortController();
    this.activeControllers.set(nextJobId, controller);

    try {
      const job = await DownloadJob.findById(nextJobId);
      if (job && job.status !== 'cancelled') {
        await DownloadWorker.processJob(job, controller.signal);
      }
    } catch (err: any) {
      console.error(`[QueueService] Error processing job ${nextJobId}:`, err);
    } finally {
      this.activeControllers.delete(nextJobId);
      this.activeJobsCount--;
      // Trigger next job in queue
      this.processNext();
    }
  }
}
