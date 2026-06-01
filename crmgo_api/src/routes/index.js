import { Router } from 'express';
import authRoute         from './auth.route.js';
import leadRoute         from './lead.route.js';
import opportunityRoute  from './opportunity.route.js';
import quoteRoute        from './quote.route.js';
import orderRoute        from './order.route.js';
import userRoute         from './user.route.js';
import businessRoute     from './business.route.js';
import supplierRoute     from './supplier.route.js';
import notificationRoute from './notification.route.js';

const router = Router();

router.use('/auth',          authRoute);
router.use('/leads',         leadRoute);
router.use('/opportunities', opportunityRoute);
router.use('/quotes',        quoteRoute);
router.use('/orders',        orderRoute);
router.use('/users',         userRoute);
router.use('/businesses',    businessRoute);
router.use('/suppliers',     supplierRoute);
router.use('/notifications', notificationRoute);

export default router;
