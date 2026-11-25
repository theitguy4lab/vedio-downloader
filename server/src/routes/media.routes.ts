import { Router } from 'express';
import { inspectMedia, getSources } from '../controllers/media.controller.js';

const router = Router();

router.post('/inspect', inspectMedia);
router.get('/sources', getSources);

export default router;
