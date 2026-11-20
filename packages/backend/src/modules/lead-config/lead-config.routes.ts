import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { addStage, createDemoWorkflow, createPipeline, getConfig, updateAssignment, updateSalesperson } from './lead-config.controller';
const router = Router(); router.use(authenticate, authorize('admin', 'sales')); router.get('/', getConfig); router.post('/pipelines', authorize('admin'), createPipeline); router.post('/pipelines/:id/stages', authorize('admin'), addStage); router.patch('/assignment', authorize('admin'), updateAssignment); router.patch('/salespeople/:id', authorize('admin'), updateSalesperson); router.post('/demo', authorize('admin'), createDemoWorkflow); export default router;
