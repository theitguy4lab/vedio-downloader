export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export type UserRole = 'user' | 'admin' | 'super_admin';

export type JobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'cancelled';
