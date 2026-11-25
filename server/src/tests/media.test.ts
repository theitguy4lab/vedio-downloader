import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import dns from 'dns/promises';
import { createApp } from '../app.js';

describe('Media Inspection & SSRF Security Tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('SSRF & URL Safety Protection', () => {
    it('should reject invalid or non-HTTP protocols', async () => {
      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'ftp://example.com/video.mp4' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROHIBITED_PROTOCOL');
    });

    it('should block localhost and loopback hostnames', async () => {
      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'http://localhost/video.mp4' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SSRF_BLOCKED');
    });

    it('should block 127.0.0.1 IP addresses', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValueOnce({ address: '127.0.0.1', family: 4 });

      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'http://127.0.0.1/video.mp4' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SSRF_BLOCKED');
    });

    it('should block cloud metadata IP (169.254.169.254)', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValueOnce({ address: '169.254.169.254', family: 4 });

      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'http://169.254.169.254/latest/meta-data' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SSRF_BLOCKED');
    });

    it('should block RFC 1918 private IP subnets (10.x, 192.168.x)', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValueOnce({ address: '192.168.1.100', family: 4 });

      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'http://internal.company.com/video.mp4' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SSRF_BLOCKED');
    });
  });

  describe('POST /api/v1/media/inspect', () => {
    it('should inspect a valid public direct media URL successfully', async () => {
      // Mock DNS lookup to public IP
      vi.spyOn(dns, 'lookup').mockResolvedValueOnce({ address: '93.184.216.34', family: 4 });

      // Mock native global fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'video/mp4',
          'content-length': '15728640', // ~15 MB
          'content-disposition': 'attachment; filename="sample_presentation.mp4"',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'https://cdn.example.com/videos/sample_presentation.mp4' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('direct');
      expect(res.body.data.title).toBe('sample_presentation');
      expect(res.body.data.approximateFileSizeBytes).toBe(15728640);
      expect(res.body.data.availableFormats.length).toBeGreaterThanOrEqual(2);

      // Verify MP3 extracted audio format is offered for video
      const mp3Format = res.body.data.availableFormats.find((f: any) => f.container === 'mp3');
      expect(mp3Format).toBeDefined();
      expect(mp3Format.audioOnly).toBe(true);
    });

    it('should reject URLs returning non-media content types', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValueOnce({ address: '93.184.216.34', family: 4 });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'text/html; charset=UTF-8',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await request(app)
        .post('/api/v1/media/inspect')
        .send({ url: 'https://example.com/article' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });
  });

  describe('GET /api/v1/media/sources', () => {
    it('should return list of supported source adapters and capabilities', async () => {
      const res = await request(app).get('/api/v1/media/sources');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sources)).toBe(true);

      const direct = res.body.data.sources.find((s: any) => s.name === 'direct');
      expect(direct).toBeDefined();
      expect(direct.status).toBe('active');
    });
  });
});
