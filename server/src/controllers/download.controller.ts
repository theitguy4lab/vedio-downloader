import { Request, Response, NextFunction } from 'express';
import { DownloadService } from '../services/download.service.js';
import { createDownloadJobSchema } from '../schemas/download.schema.js';

export async function createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createDownloadJobSchema.parse(req.body);
    const job = await DownloadService.createJob(req.user!.userId, validated);

    res.status(202).json({
      success: true,
      message: 'Download job created and enqueued',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await DownloadService.getUserJobs(req.user!.userId, page, limit);

    res.status(200).json({
      success: true,
      message: 'User download jobs retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await DownloadService.getJobById(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Job details retrieved',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await DownloadService.cancelJob(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Job cancelled successfully',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
}

export async function retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await DownloadService.retryJob(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Job re-enqueued for retry',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await DownloadService.deleteJob(req.params.id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Job record removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
