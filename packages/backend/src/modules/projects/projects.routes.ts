import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { listProjects, getProject, createProject, updateProject, updateProjectStatus, updateMilestones, uploadDocument, deleteDocument, serveProjectDocument } from './projects.controller';
import { authenticate, authorize, checkCustomerOwnership } from '../../middleware/auth';
import { config } from '../../config';
import { createReport, getCloseout, reportPdf, saveSerials } from './projectReports.controller';

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(config.uploadDir, 'projects'),
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const router = Router();

router.use(authenticate);

router.get('/', checkCustomerOwnership, listProjects);
router.get('/:id', getProject);
router.get('/:id/closeout', authorize('admin', 'sales', 'installer'), getCloseout);
router.post('/:id/serials', authorize('admin', 'installer'), saveSerials);
router.post('/:id/reports', authorize('admin', 'installer'), createReport);
router.get('/:id/reports/:reportId/pdf', authorize('admin', 'sales', 'installer'), reportPdf);
router.post('/', authorize('admin', 'sales'), createProject);
router.patch('/:id', authorize('admin', 'sales', 'installer'), updateProject);
router.patch('/:id/status', authorize('admin', 'installer'), updateProjectStatus);
router.put('/:id/milestones', authorize('admin', 'installer'), updateMilestones);
router.post('/:id/documents', authorize('admin', 'installer'), upload.single('file'), uploadDocument);
router.get('/:id/documents/:docId/file', authorize('admin', 'sales', 'installer'), serveProjectDocument);
router.delete('/:id/documents/:docId', authorize('admin'), deleteDocument);

export default router;
