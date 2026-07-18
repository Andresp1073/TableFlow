import { Router } from 'express';
import { requireAuth } from '../../../../middlewares/auth.js';
import { createPaymentController } from '../controllers/PaymentController.js';

const controller = createPaymentController();
const router = Router({ mergeParams: true });

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/providers', requireAuth, controller.listProviders);
router.get('/', requireAuth, controller.listTransactions);
router.get('/:transactionId', requireAuth, controller.getTransaction);
router.post('/:transactionId/refund', requireAuth, controller.refundTransaction);

export default router;
