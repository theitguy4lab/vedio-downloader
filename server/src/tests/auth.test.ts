import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { User } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { env } from '../config/env.js';

describe('Auth API & Security Tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should reject registration if required fields are missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject weak passwords without numbers or uppercase letters', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 Conflict if email is already registered', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        email: 'existing@example.com',
      } as any);

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'existing@example.com',
        password: 'StrongPassword123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should successfully register a new user and set HTTP cookies', async () => {
      const mockUserId = new Types.ObjectId();
      vi.spyOn(User, 'findOne').mockResolvedValueOnce(null);
      vi.spyOn(User, 'hashPassword').mockResolvedValueOnce('hashed_secret_pw');
      vi.spyOn(User, 'create').mockResolvedValueOnce({
        _id: mockUserId,
        name: 'Alice Wonder',
        email: 'alice@example.com',
        role: 'user',
        storageUsageBytes: 0,
        preferences: { theme: 'dark', defaultFormat: 'mp4', defaultQuality: '1080p', notificationsEnabled: true },
        createdAt: new Date(),
      } as any);
      vi.spyOn(Session, 'create').mockResolvedValueOnce({} as any);

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Alice Wonder',
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.id).toBe(mockUserId.toString());
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Check cookies
      const cookies = res.headers['set-cookie'] || [];
      expect(cookies.some((c: string) => c.includes('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 if user does not exist', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 if password does not match', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        email: 'alice@example.com',
        isActive: true,
        comparePassword: vi.fn().mockResolvedValue(false),
      } as any);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 200 OK and tokens on correct credentials', async () => {
      const mockUserId = new Types.ObjectId();
      vi.spyOn(User, 'findOne').mockResolvedValueOnce({
        _id: mockUserId,
        name: 'Alice Wonder',
        email: 'alice@example.com',
        role: 'user',
        isActive: true,
        storageUsageBytes: 0,
        preferences: { theme: 'dark', defaultFormat: 'mp4', defaultQuality: '1080p', notificationsEnabled: true },
        createdAt: new Date(),
        comparePassword: vi.fn().mockResolvedValue(true),
      } as any);
      vi.spyOn(Session, 'create').mockResolvedValueOnce({} as any);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 Unauthorized if no token provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('should return 200 OK with user profile when valid Bearer token passed', async () => {
      const mockUserId = new Types.ObjectId();
      const validToken = jwt.sign(
        { userId: mockUserId.toString(), email: 'alice@example.com', role: 'user' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      vi.spyOn(User, 'findById').mockResolvedValueOnce({
        _id: mockUserId,
        name: 'Alice Wonder',
        email: 'alice@example.com',
        role: 'user',
        storageUsageBytes: 1024,
        preferences: { theme: 'dark', defaultFormat: 'mp4', defaultQuality: '1080p', notificationsEnabled: true },
        createdAt: new Date(),
      } as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.storageUsageBytes).toBe(1024);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear cookies and return 200 OK on logout', async () => {
      vi.spyOn(Session, 'findOneAndDelete').mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
