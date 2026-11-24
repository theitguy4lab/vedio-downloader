import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    error: {
      code,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}
