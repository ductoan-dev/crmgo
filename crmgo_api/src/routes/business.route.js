import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/business.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/',       getAll);
router.get('/:id',    getById);
router.post('/',      authorize('sales', 'mkt', 'cskh', 'admin'), create);
router.put('/:id',    authorize('sales', 'mkt', 'cskh', 'admin'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
