import { Router } from 'express';
import { getAll, getById, create, update, advance, recordPayment, rejectOrder, prodFields, smgrAssign } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/',               getAll);
router.get('/:id',            getById);
router.post('/',              authorize('sales', 'admin'), create);
router.put('/:id',            authorize('sales', 'admin'), update);

// Advance workflow — any authenticated role (service validates per-step role)
router.post('/:id/advance',         advance);
// SMGR: giao đơn cho NCC (advance workflow + lưu smgr fields)
router.post('/:id/smgr-assign',     authorize('smgr', 'admin'), smgrAssign);
// Prod: cập nhật field báo giá / defect (chỉ prod & admin)
router.patch('/:id/prod-fields',    authorize('prod', 'admin'), prodFields);
// KT-specific endpoints
router.post('/:id/record-payment',  authorize('ketoan', 'admin'), recordPayment);
router.post('/:id/reject',          authorize('ketoan', 'admin'), rejectOrder);

export default router;
