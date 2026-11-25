import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { DownloadJob, IDownloadJobDocument } from '../models/downloadJob.model.js';
import { MediaFile } from '../models/mediaFile.model.js';
import { User } from '../models/user.model.js';
import { StorageService } from '../services/storage.service.js';
import { validateSafeUrl } from '../utils/urlValidator.js';
import { env } from '../config/env.js';

export class DownloadWorker {
  public static async processJob(
    job: IDownloadJobDocument,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const tempFilePath = StorageService.getTempFilePath(job.selectedFormat.container);

    try {
      // 1. Transition state: processing -> downloading
      job.status = 'downloading';
      job.progress = {
        percentage: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        eta: 0,
      };
      await job.save();

      // 2. Validate URL safety before connecting
      const validated = await validateSafeUrl(job.originalUrl);

      // 3. Initiate HTTP download stream
      const response = await fetch(validated.parsedUrl.toString(), {
        signal: abortSignal,
        headers: {
          'User-Agent': 'VideoDownloader/1.0 (+https://videodownloader.local)',
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Remote server responded with HTTP ${response.status} ${response.statusText}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      job.progress.totalBytes = totalBytes;

      if (totalBytes > env.MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size (${totalBytes} bytes) exceeds maximum allowed limit (${env.MAX_FILE_SIZE_BYTES} bytes)`);
      }

      // 4. Stream response body to disk while tracking progress
      const fileWriteStream = fs.createWriteStream(tempFilePath);
      let downloadedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;
      let lastDbUpdate = Date.now();

      // Convert Web ReadableStream to Node.js Readable
      const nodeReadable = Readable.fromWeb(response.body as any);

      nodeReadable.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;

        if (downloadedBytes > env.MAX_FILE_SIZE_BYTES) {
          nodeReadable.destroy(new Error('Download exceeded maximum file size limit'));
          return;
        }

        const now = Date.now();
        // Update speed and progress metrics every 500ms
        if (now - lastDbUpdate >= 500) {
          const timeDiffSec = (now - lastTime) / 1000;
          const bytesDiff = downloadedBytes - lastBytes;
          const currentSpeed = timeDiffSec > 0 ? Math.round(bytesDiff / timeDiffSec) : 0;

          const percentage = totalBytes > 0
            ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100))
            : 0;

          const remainingBytes = totalBytes > downloadedBytes ? totalBytes - downloadedBytes : 0;
          const eta = currentSpeed > 0 ? Math.round(remainingBytes / currentSpeed) : 0;

          job.progress.percentage = percentage;
          job.progress.downloadedBytes = downloadedBytes;
          job.progress.speed = currentSpeed;
          job.progress.eta = eta;

          // Non-blocking save to MongoDB
          job.save().catch(() => {});

          lastTime = now;
          lastBytes = downloadedBytes;
          lastDbUpdate = now;
        }
      });

      await pipeline(nodeReadable, fileWriteStream);

      // 5. Check if job was cancelled while writing
      const currentJob = await DownloadJob.findById(job._id);
      if (currentJob?.status === 'cancelled') {
        await StorageService.deleteFile(tempFilePath);
        return;
      }

      // 6. Promote temp file to permanent user storage
      const promoted = await StorageService.promoteTempToMedia(
        tempFilePath,
        job.userId.toString(),
        job.selectedFormat.container
      );

      // 7. Create MediaFile record in MongoDB
      const mediaFile = await MediaFile.create({
        userId: job.userId,
        jobId: job._id,
        title: job.mediaInfo.title || 'Downloaded Media',
        originalFilename: `${job.mediaInfo.title || 'media'}.${job.selectedFormat.container}`,
        storageKey: promoted.storageKey,
        container: job.selectedFormat.container,
        mimeType: response.headers.get('content-type') || 'application/octet-stream',
        fileSizeBytes: promoted.fileSizeBytes,
      });

      // 8. Update User storage quota
      await User.findByIdAndUpdate(job.userId, {
        $inc: { storageUsageBytes: promoted.fileSizeBytes },
      });

      // 9. Mark job completed
      job.status = 'completed';
      job.resultFileId = mediaFile._id;
      job.progress = {
        percentage: 100,
        downloadedBytes: promoted.fileSizeBytes,
        totalBytes: promoted.fileSizeBytes,
        speed: 0,
        eta: 0,
      };
      await job.save();
    } catch (err: any) {
      // Clean up temp file on failure
      await StorageService.deleteFile(tempFilePath);

      // Check if this was a user-initiated cancellation
      const latestJob = await DownloadJob.findById(job._id);
      if (latestJob?.status === 'cancelled') {
        return;
      }

      job.status = 'failed';
      job.error = {
        code: err.name === 'AbortError' ? 'DOWNLOAD_CANCELLED' : 'DOWNLOAD_FAILED',
        message: err.message || 'An error occurred during download processing',
      };
      await job.save();
    }
  }
}
