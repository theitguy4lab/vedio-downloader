import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TokenPayload } from './auth.service.js';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  let token = socket.handshake.auth?.token;

  if (!token && socket.handshake.headers.authorization) {
    const header = socket.handshake.headers.authorization;
    if (header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }
  }

  if (!token) {
    return next(new Error('Authentication error: Token required for WebSocket connection'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    socket.data.user = decoded;
    next();
  } catch {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
}

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static init(server: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.CLIENT_URL,
        credentials: true,
      },
    });

    // Register JWT Authentication Handshake Middleware
    this.io.use(socketAuthMiddleware);

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as TokenPayload;
      const userRoom = `user:${user.userId}`;

      // Join private user-specific channel
      socket.join(userRoom);
      console.log(`[Socket.IO] Authenticated socket ${socket.id} joined private room ${userRoom}`);

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Socket ${socket.id} disconnected from ${userRoom}`);
      });
    });

    return this.io;
  }

  public static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO has not been initialized. Call SocketService.init first.');
    }
    return this.io;
  }

  /**
   * Broadcasts a real-time event strictly to the private room of the specified user
   */
  public static emitToUser<T = any>(userId: string, event: string, payload: T): void {
    if (!this.io) {
      // In test mode or before init, safely no-op
      return;
    }
    const userRoom = `user:${userId}`;
    this.io.to(userRoom).emit(event, payload);
  }
}
