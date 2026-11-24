import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

async function bootstrap() {
  await connectDatabase();

  server.listen(env.PORT, () => {
    console.log(`[Server] VideoDownloader running on http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] Healthcheck: http://localhost:${env.PORT}/api/v1/health`);
  });
}

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\n[Server] Graceful shutdown initiated...');
  server.close(async () => {
    await disconnectDatabase();
    console.log('[Server] Server closed successfully.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

if (env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('[Server] Bootstrap fatal error:', err);
    process.exit(1);
  });
}
