import { Router } from 'express';
import { getAll, getById, create, update, remove, transfer, convertToOpp } from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/',           getAll);
router.get('/:id',        getById);
router.post('/',          authorize('sales', 'mkt', 'admin'), create);
router.put('/:id',        authorize('sales', 'mkt', 'admin'), update);
router.delete('/:id',     authorize('sales', 'mkt', 'admin'), remove);
router.post('/:id/transfer', authorize('mkt', 'admin'),       transfer);
router.post('/:id/convert',  authorize('sales', 'admin'),      convertToOpp);

export default router;
