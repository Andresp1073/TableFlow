import { Router } from 'express';
import { requireAuth } from '../../../../middlewares/auth.js';
import { validate } from '../../../../middlewares/validate.js';
import { createLoyaltyController } from '../controllers/LoyaltyController.js';
import { z } from 'zod';

const controller = createLoyaltyController();

const router = Router({ mergeParams: true });

router.get('/dashboard', requireAuth, controller.getLoyaltyDashboard);
router.get('/rewards', requireAuth, controller.getRewards);
router.post('/register', requireAuth, validate({
  body: z.object({
    customerId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    programId: z.string().min(1),
  }),
}), controller.registerCustomer);
router.get('/customers/:customerProfileId', requireAuth, controller.getCustomerProfile);
router.post('/earn', requireAuth, validate({
  body: z.object({
    customerProfileId: z.string().min(1),
    spentAmount: z.number().min(0),
    referenceId: z.string().min(1),
    referenceType: z.string().min(1),
  }),
}), controller.earnPoints);
router.post('/redeem', requireAuth, validate({
  body: z.object({
    customerProfileId: z.string().min(1),
    rewardId: z.string().min(1),
    referenceId: z.string().min(1),
  }),
}), controller.redeemReward);
router.post('/adjust', requireAuth, validate({
  body: z.object({
    customerProfileId: z.string().min(1),
    points: z.number(),
    reason: z.string().min(1),
  }),
}), controller.adjustPoints);
router.get('/transactions/:customerProfileId', requireAuth, controller.getTransactionHistory);
router.get('/birthdays', requireAuth, controller.getBirthdays);

export default router;
