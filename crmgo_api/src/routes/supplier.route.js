import { Router } from 'express';
import {
  getAll, getById, create, update, remove,
  sendOrder, updateSupplierOrderStatus,
} from '../controllers/supplier.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/',       getAll);
router.get('/:id',    getById);
router.post('/',      authorize('admin'), create);
router.put('/:id',    authorize('smgr', 'admin'), update);
router.delete('/:id', authorize('admin'), remove);

// Smgr gửi đơn cho NCC cụ thể
router.post('/:id/send-order',    authorize('smgr', 'admin'), sendOrder);

// NCC cập nhật trạng thái supplier order
router.patch('/orders/:soId/status', authorize('prod', 'admin'), updateSupplierOrderStatus);

export default router;
