import { Router } from 'express';
import { requireAuth } from '../../../../middlewares/auth.js';
import { validate } from '../../../../middlewares/validate.js';
import { createInventoryController } from '../controllers/InventoryController.js';
import { z } from 'zod';

const controller = createInventoryController();

const router = Router({ mergeParams: true });

router.get('/dashboard', requireAuth, controller.getDashboard);

router.get('/products', requireAuth, controller.listProducts);
router.get('/products/:productId', requireAuth, controller.getProduct);
router.post('/products', requireAuth, validate({ body: z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  costPerUnit: z.number().min(0).optional(),
  sku: z.string().optional(),
  preferredSupplierId: z.string().optional(),
  perishable: z.boolean().optional(),
  shelfLifeDays: z.number().int().positive().optional(),
  storageInstructions: z.string().optional(),
}) }), controller.createProduct);
router.put('/products/:productId', requireAuth, controller.updateProduct);
router.patch('/products/:productId/archive', requireAuth, controller.archiveProduct);
router.patch('/products/:productId/restore', requireAuth, controller.restoreProduct);

router.get('/categories', requireAuth, controller.listCategories);

router.get('/suppliers', requireAuth, controller.listSuppliers);
router.get('/suppliers/:supplierId', requireAuth, controller.getSupplier);
router.post('/suppliers', requireAuth, controller.createSupplier);

router.get('/stock', requireAuth, controller.getStockSummary);
router.get('/stock/items', requireAuth, controller.getStockItems);

router.get('/stock-movements', requireAuth, controller.listStockMovements);

router.get('/purchase-orders', requireAuth, controller.listPurchaseOrders);
router.get('/purchase-orders/:orderId', requireAuth, controller.getPurchaseOrder);
router.post('/purchase-orders', requireAuth, controller.createPurchaseOrder);
router.patch('/purchase-orders/:orderId/submit', requireAuth, controller.submitPurchaseOrder);
router.patch('/purchase-orders/:orderId/approve', requireAuth, controller.approvePurchaseOrder);
router.post('/purchase-orders/:orderId/receive', requireAuth, controller.receivePurchaseOrder);
router.patch('/purchase-orders/:orderId/cancel', requireAuth, controller.cancelPurchaseOrder);

router.post('/receiving', requireAuth, controller.receiveStock);

router.get('/alerts', requireAuth, controller.getAlerts);

export default router;
