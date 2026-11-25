import { Request, Response, NextFunction } from 'express';
import { InspectionService } from '../services/inspection.service.js';
import { inspectMediaSchema } from '../schemas/media.schema.js';

export async function inspectMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = inspectMediaSchema.parse(req.body);
    const inspectionResult = await InspectionService.inspectUrl(url);

    res.status(200).json({
      success: true,
      message: 'Media inspected successfully',
      data: inspectionResult,
    });
  } catch (error) {
    next(error);
  }
}

export function getSources(_req: Request, res: Response): void {
  const sources = InspectionService.listSources();
  res.status(200).json({
    success: true,
    message: 'Supported media sources retrieved',
    data: { sources },
  });
}
