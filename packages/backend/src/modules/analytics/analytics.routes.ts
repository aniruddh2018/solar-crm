import { Router } from 'express';
import { dashboard, salesReport, pipelineReport } from './analytics.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('admin', 'sales'), dashboard);
router.get('/sales', authorize('admin'), salesReport);
router.get('/pipeline', authorize('admin', 'sales'), pipelineReport);

export default router;
