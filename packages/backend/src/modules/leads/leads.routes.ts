import { Router } from 'express';
import { listLeads, getLead, createLead, updateLead, updateLeadStatus, addActivity, convertLead } from './leads.controller';
import { authenticate, authorize, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin', 'sales'), listLeads);
router.get('/:id', authenticate, authorize('admin', 'sales'), getLead);
router.post('/', optionalAuthenticate, createLead); // Sales users self-assign; public/online leads use assignment policy.
router.patch('/:id', authenticate, authorize('admin', 'sales'), updateLead);
router.patch('/:id/status', authenticate, authorize('admin', 'sales'), updateLeadStatus);
router.post('/:id/activities', authenticate, authorize('admin', 'sales'), addActivity);
router.post('/:id/convert', authenticate, authorize('admin', 'sales'), convertLead);

export default router;
