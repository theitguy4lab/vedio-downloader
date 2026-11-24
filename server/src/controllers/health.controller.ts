import { Request, Response } from 'express';
import mongoose from 'mongoose';

export function getHealthStatus(_req: Request, res: Response): void {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'VideoDownloader API is operational',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatusMap[dbState] || 'unknown',
      version: '1.0.0',
    },
  });
}
