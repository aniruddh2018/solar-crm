import { Router } from 'express';
import { listInvoices, getInvoice, createInvoice, updateInvoice, addPayment, getInvoicePdf } from './invoices.controller';
import { authenticate, authorize, checkCustomerOwnership } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', checkCustomerOwnership, listInvoices);
router.get('/:id', getInvoice);
router.post('/', authorize('admin', 'sales'), createInvoice);
router.patch('/:id', authorize('admin', 'sales'), updateInvoice);
router.post('/:id/payments', authorize('admin', 'sales'), addPayment);
router.get('/:id/pdf', getInvoicePdf);

export default router;
