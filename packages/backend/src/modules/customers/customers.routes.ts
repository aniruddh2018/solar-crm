import { Router } from 'express'; import multer from 'multer'; import path from 'path'; import fs from 'fs';
import { listCustomers, getCustomer, createCustomer, updateCustomer, uploadCustomerDocument, serveCustomerDocument } from './customers.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const customerUploadDir = path.join(process.cwd(), 'uploads', 'customer-documents'); fs.mkdirSync(customerUploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: customerUploadDir, filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) }), limits: { fileSize: 25 * 1024 * 1024 } });

router.use(authenticate, authorize('admin', 'sales', 'installer'));

router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', authorize('admin', 'sales'), createCustomer);
router.post('/:id/documents', authorize('admin', 'sales', 'installer'), upload.single('file'), uploadCustomerDocument);
router.get('/:id/documents/:docId/file', serveCustomerDocument);
router.patch('/:id', authorize('admin', 'sales'), updateCustomer);

export default router;
