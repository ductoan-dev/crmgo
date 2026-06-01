import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/opportunity.controller.js';
import { getByOpp, create as createQuote } from '../controllers/quote.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/',       getAll);
router.get('/:id',    getById);
router.post('/',      authorize('sales', 'admin'), create);
router.put('/:id',    authorize('sales', 'admin'), update);
router.delete('/:id', authorize('sales', 'admin'), remove);

// Quotes nested under opportunity
router.get('/:oppId/quotes',  getByOpp);
router.post('/:oppId/quotes', authorize('smgr', 'admin'), createQuote);

export default router;
