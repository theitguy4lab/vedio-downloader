import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { DownloadJob } from '../models/downloadJob.model.js';
import { User } from '../models/user.model.js';
import { QueueService } from '../services/queue.service.js';
import { env } from '../config/env.js';

describe('Download Lifecycle & Management Tests', () => {
  const app = createApp();
  const mockUserId = new Types.ObjectId();
  const userToken = jwt.sign(
    { userId: mockUserId.toString(), email: 'downloader@example.com', role: 'user' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/downloads', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/downloads').send({
        url: 'https://example.com/video.mp4',
        format: { container: 'mp4' },
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should reject requests with missing URL or format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/downloads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject creation if user storage quota is exceeded (2GB)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValueOnce({
        _id: mockUserId,
        storageUsageBytes: 2147483648, // 2 GB
      } as any);

      const res = await request(app)
        .post('/api/v1/downloads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'https://example.com/video.mp4',
          format: { container: 'mp4' },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
    });

    it('should reject creation if active concurrency limit (3) is reached', async () => {
      vi.spyOn(User, 'findById').mockResolvedValueOnce({
        _id: mockUserId,
        storageUsageBytes: 0,
      } as any);
      vi.spyOn(DownloadJob, 'countDocuments').mockResolvedValueOnce(3);

      const res = await request(app)
        .post('/api/v1/downloads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'https://example.com/video.mp4',
          format: { container: 'mp4' },
        });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONCURRENCY_LIMIT_EXCEEDED');
    });

    it('should successfully create and enqueue a download job', async () => {
      const mockJobId = new Types.ObjectId();
      vi.spyOn(User, 'findById').mockResolvedValueOnce({
        _id: mockUserId,
        storageUsageBytes: 0,
      } as any);
      vi.spyOn(DownloadJob, 'countDocuments').mockResolvedValueOnce(0);
      vi.spyOn(DownloadJob, 'create').mockResolvedValueOnce({
        _id: mockJobId,
        userId: mockUserId,
        source: 'direct',
        originalUrl: 'https://example.com/video.mp4',
        selectedFormat: { container: 'mp4', quality: 'original', audioOnly: false },
        status: 'pending',
        progress: { percentage: 0, downloadedBytes: 0 },
      } as any);
      vi.spyOn(QueueService, 'enqueueJob').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/downloads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'https://example.com/video.mp4',
          format: { container: 'mp4', quality: 'original' },
          mediaInfo: { title: 'Test Video' },
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job._id).toBe(mockJobId.toString());
    });
  });

  describe('GET /api/v1/downloads', () => {
    it('should return paginated download jobs for the authenticated user', async () => {
      const mockJobs = [
        {
          _id: new Types.ObjectId(),
          userId: mockUserId,
          status: 'completed',
          originalUrl: 'https://example.com/video.mp4',
        },
      ];

      vi.spyOn(DownloadJob, 'find').mockReturnValueOnce({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(mockJobs),
      } as any);
      vi.spyOn(DownloadJob, 'countDocuments').mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/v1/downloads')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /api/v1/downloads/:id', () => {
    it('should return job details for owner', async () => {
      const mockJobId = new Types.ObjectId();
      vi.spyOn(DownloadJob, 'findOne').mockReturnValueOnce({
        populate: vi.fn().mockResolvedValueOnce({
          _id: mockJobId,
          userId: mockUserId,
          status: 'downloading',
          progress: { percentage: 45, downloadedBytes: 4500, totalBytes: 10000, speed: 500 },
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/downloads/${mockJobId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.progress.percentage).toBe(45);
    });

    it('should return 404 if job does not exist or belongs to another user', async () => {
      vi.spyOn(DownloadJob, 'findOne').mockReturnValueOnce({
        populate: vi.fn().mockResolvedValueOnce(null),
      } as any);

      const res = await request(app)
        .get('/api/v1/downloads/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('JOB_NOT_FOUND');
    });
  });

  describe('POST /api/v1/downloads/:id/cancel', () => {
    it('should cancel active job via QueueService', async () => {
      const mockJobId = new Types.ObjectId();
      vi.spyOn(QueueService, 'cancelJob').mockResolvedValueOnce({
        _id: mockJobId,
        status: 'cancelled',
      } as any);

      const res = await request(app)
        .post(`/api/v1/downloads/${mockJobId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe('cancelled');
    });
  });
});
