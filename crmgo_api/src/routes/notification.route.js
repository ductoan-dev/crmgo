import { Router } from 'express';
import { getByUser, markRead, markAllRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/',              getByUser);
router.patch('/:id/read',    markRead);
router.patch('/read-all',    markAllRead);

export default router;
