import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { SocketService, socketAuthMiddleware } from '../services/socket.service.js';
import { env } from '../config/env.js';

describe('Socket.IO Real-Time Service Tests', () => {
  let server: http.Server;

  beforeEach(() => {
    vi.restoreAllMocks();
    server = http.createServer();
  });

  it('should initialize Socket.IO server and return instance', () => {
    const io = SocketService.init(server);
    expect(io).toBeDefined();
    expect(SocketService.getIO()).toBe(io);
  });

  it('should format user room identifier correctly on emitToUser', () => {
    const io = SocketService.init(server);
    const mockTo = vi.fn().mockReturnValue({
      emit: vi.fn(),
    });
    vi.spyOn(io, 'to').mockImplementation(mockTo);

    SocketService.emitToUser('user123', 'download:progress', {
      jobId: 'job456',
      percentage: 50,
    });

    expect(mockTo).toHaveBeenCalledWith('user:user123');
  });

  it('should reject connection when handshake has no token', () => {
    const mockSocket: any = {
      handshake: { auth: {}, headers: {} },
      data: {},
    };
    const next = vi.fn();

    socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('Token required for WebSocket connection');
  });

  it('should reject connection when handshake token is invalid', () => {
    const mockSocket: any = {
      handshake: { auth: { token: 'invalid.jwt.token' }, headers: {} },
      data: {},
    };
    const next = vi.fn();

    socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('Invalid or expired token');
  });

  it('should authenticate connection when handshake token is valid', () => {
    const validToken = jwt.sign(
      { userId: 'user999', email: 'socket@example.com', role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const mockSocket: any = {
      handshake: { auth: { token: validToken }, headers: {} },
      data: {},
    };
    const next = vi.fn();

    socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.data.user.userId).toBe('user999');
  });
});
