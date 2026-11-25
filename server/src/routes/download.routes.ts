import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJob,
  cancelJob,
  retryJob,
  deleteJob,
} from '../controllers/download.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All download routes require authentication
router.use(authenticate);

router.post('/', createJob);
router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/:id/cancel', cancelJob);
router.post('/:id/retry', retryJob);
router.delete('/:id', deleteJob);

export default router;
