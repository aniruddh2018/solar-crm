import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getGstSettings, updateGstSettings, listSolarHsn } from './gst.controller';

const router = Router();
router.use(authenticate);
router.get('/settings', authorize('admin', 'sales'), getGstSettings);
router.patch('/settings', authorize('admin'), updateGstSettings);
router.get('/hsn', authorize('admin', 'sales', 'installer'), listSolarHsn);
export default router;
