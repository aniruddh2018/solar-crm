import { Router } from 'express'; import { authenticate, authorize } from '../../middleware/auth'; import { createSupplier, listSuppliers } from './suppliers.controller';
const router = Router(); router.use(authenticate, authorize('admin', 'sales', 'installer')); router.get('/', listSuppliers); router.post('/', authorize('admin', 'sales'), createSupplier); export default router;
