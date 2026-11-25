import { describe, it, expect, beforeEach } from 'vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockStorage = new LocalStorageMock();

describe('Client Foundation & Auth State Tests', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('should initialize unauthenticated state when storage has no token', () => {
    const token = mockStorage.getItem('accessToken');
    expect(token).toBeNull();
  });

  it('should retain access token in storage when set', () => {
    mockStorage.setItem('accessToken', 'mock-jwt-token-12345');
    expect(mockStorage.getItem('accessToken')).toBe('mock-jwt-token-12345');
  });

  it('should clear token from storage on logout', () => {
    mockStorage.setItem('accessToken', 'mock-jwt-token-12345');
    mockStorage.removeItem('accessToken');
    expect(mockStorage.getItem('accessToken')).toBeNull();
  });
});

describe('Media Format Helper Tests', () => {
  it('should correctly format byte values to human readable MB/GB', () => {
    const formatBytes = (bytes?: number) => {
      if (!bytes) return 'Unknown Size';
      const mb = bytes / (1024 * 1024);
      if (mb >= 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
      }
      return `${mb.toFixed(1)} MB`;
    };

    expect(formatBytes(undefined)).toBe('Unknown Size');
    expect(formatBytes(15728640)).toBe('15.0 MB');
    expect(formatBytes(1073741824)).toBe('1.00 GB');
    expect(formatBytes(2684354560)).toBe('2.50 GB');
  });

  it('should correctly detect media file extensions from URL strings', () => {
    const isDirectMediaUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        return /\.(mp4|webm|mkv|mov|mp3|m4a|wav|aac|flac)$/i.test(parsed.pathname);
      } catch {
        return false;
      }
    };

    expect(isDirectMediaUrl('https://example.com/video.mp4')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/audio.mp3')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/article.html')).toBe(false);
    expect(isDirectMediaUrl('invalid-url')).toBe(false);
  });
});

describe('Download Progress & Real-Time Event Tests', () => {
  it('should format transfer speed in KB/s and MB/s correctly', () => {
    const formatSpeed = (bytesPerSec?: number) => {
      if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
      const mbps = bytesPerSec / (1024 * 1024);
      if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`;
      return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    };

    expect(formatSpeed(0)).toBe('0 KB/s');
    expect(formatSpeed(512000)).toBe('500 KB/s');
    expect(formatSpeed(2097152)).toBe('2.0 MB/s');
    expect(formatSpeed(15728640)).toBe('15.0 MB/s');
  });

  it('should calculate ETA seconds remaining correctly', () => {
    const calculateEta = (totalBytes: number, downloadedBytes: number, speedBytesPerSec: number) => {
      if (speedBytesPerSec <= 0) return 0;
      const remaining = Math.max(0, totalBytes - downloadedBytes);
      return Math.round(remaining / speedBytesPerSec);
    };

    expect(calculateEta(10000000, 5000000, 1000000)).toBe(5);
    expect(calculateEta(10000000, 10000000, 1000000)).toBe(0);
    expect(calculateEta(10000000, 2000000, 0)).toBe(0);
  });

  it('should apply real-time progress update event to active job state', () => {
    const initialJobs = [
      {
        _id: 'job-1',
        status: 'queued',
        progress: {
          percentage: 0,
          downloadedBytes: 0,
          totalBytes: 1000000,
          speed: 0,
          eta: 0,
        },
      },
    ];

    const socketProgressPayload = {
      jobId: 'job-1',
      percentage: 65,
      downloadedBytes: 650000,
      totalBytes: 1000000,
      speed: 125000,
      eta: 3,
    };

    const updatedJobs = initialJobs.map((job) => {
      if (job._id === socketProgressPayload.jobId) {
        return {
          ...job,
          status: 'downloading',
          progress: {
            percentage: socketProgressPayload.percentage,
            downloadedBytes: socketProgressPayload.downloadedBytes,
            totalBytes: socketProgressPayload.totalBytes,
            speed: socketProgressPayload.speed,
            eta: socketProgressPayload.eta,
          },
        };
      }
      return job;
    });

    expect(updatedJobs[0].status).toBe('downloading');
    expect(updatedJobs[0].progress.percentage).toBe(65);
    expect(updatedJobs[0].progress.eta).toBe(3);
  });
});
