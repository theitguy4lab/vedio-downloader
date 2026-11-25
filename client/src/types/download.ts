export type JobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DownloadProgress {
  percentage: number;
  downloadedBytes: number;
  totalBytes?: number;
  speed?: number;
  eta?: number;
}

export interface DownloadJob {
  _id: string;
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
  progress: DownloadProgress;
  resultFileId?: string;
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
}
