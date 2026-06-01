import { Router } from 'express';
import { update, remove } from '../controllers/quote.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.put('/:id',    authorize('smgr', 'admin'), update);
router.delete('/:id', authorize('smgr', 'admin'), remove);

export default router;
