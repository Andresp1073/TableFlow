import { Router } from 'express';
import { requireAuth } from '../../../../middlewares/auth.js';
import { createDashboardController } from '../controllers/DashboardController.js';

const controller = createDashboardController();

const router = Router({ mergeParams: true });

router.get('/', requireAuth, controller.getDashboard);
router.get('/kitchen', requireAuth, controller.getKitchenStatus);
router.get('/inventory', requireAuth, controller.getInventoryAlerts);
router.get('/revenue', requireAuth, controller.getRevenueSummary);

export default router;
