import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import mediaRoutes from './media.routes.js';
import downloadRoutes from './download.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/downloads', downloadRoutes);

export default router;
