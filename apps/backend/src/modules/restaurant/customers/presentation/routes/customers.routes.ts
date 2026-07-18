import { Router } from 'express';
import { requireAuth } from '../../../../../middlewares/auth.js';
import { validate } from '../../../../../middlewares/validate.js';
import { createCustomerController } from '../controllers/CustomerController.js';
import { z } from 'zod';

const controller = createCustomerController();

const router = Router({ mergeParams: true });

router.get('/dashboard', requireAuth, controller.getDashboard);

router.get('/', requireAuth, controller.list);
router.get('/:customerId', requireAuth, controller.getById);
router.post('/', requireAuth, validate({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
    preferredLanguage: z.string().optional(),
    notes: z.string().nullable().optional(),
    marketingConsent: z.boolean().optional(),
  }),
}), controller.create);
router.put('/:customerId', requireAuth, controller.update);
router.patch('/:customerId/archive', requireAuth, controller.archive);
router.patch('/:customerId/restore', requireAuth, controller.restore);
router.post('/:customerId/tags', requireAuth, controller.addTag);
router.post('/:customerId/notes', requireAuth, controller.addNote);
router.post('/:customerId/loyalty/adjust', requireAuth, controller.adjustLoyaltyPoints);

export default router;
