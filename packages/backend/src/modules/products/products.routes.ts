import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, listTransactions, createTransaction, listCategories, createCategory } from './products.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate, authorize('admin', 'sales', 'installer'));

router.get('/', listProducts);
router.get('/categories/list', listCategories);
router.post('/categories', authorize('admin', 'sales'), createCategory);
router.get('/:id', getProduct);
router.get('/:id/transactions', listTransactions);
router.post('/', authorize('admin', 'sales'), createProduct);
router.patch('/:id', authorize('admin'), updateProduct);
router.post('/:id/transactions', authorize('admin', 'sales'), createTransaction);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
