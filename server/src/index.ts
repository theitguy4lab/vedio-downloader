import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { SocketService } from './services/socket.service.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO with authentication middleware
export const io = SocketService.init(server);

async function bootstrap() {
  await connectDatabase();

  server.listen(env.PORT, () => {
    console.log(`[Server] VideoDownloader running on http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] Healthcheck: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`[Server] WebSocket Server listening for connections`);
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
