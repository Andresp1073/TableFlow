import { Router } from "express";
import { requireAuth } from "../../../../middlewares/auth.js";
import { validate } from "../../../../middlewares/validate.js";
import { createOrderController } from "../controllers/OrderController.js";
import { CreateOrderSchema, CreateOrderItemSchema, UpdateOrderSchema } from "../../application/dtos/index.js";
import { z } from "zod";

const controller = createOrderController();

const router = Router({ mergeParams: true });

router.get("/dashboard", requireAuth, controller.getDashboard);

router.get("/", requireAuth, controller.listOrders);
router.get("/:orderId", requireAuth, controller.getOrder);
router.post(
  "/",
  requireAuth,
  validate({ body: CreateOrderSchema }),
  controller.createOrder,
);
router.put(
  "/:orderId",
  requireAuth,
  validate({ body: UpdateOrderSchema }),
  controller.updateOrder,
);
router.patch(
  "/:orderId/cancel",
  requireAuth,
  validate({ body: z.object({ reason: z.string().optional() }) }),
  controller.cancelOrder,
);

router.post(
  "/:orderId/items",
  requireAuth,
  validate({ body: CreateOrderItemSchema }),
  controller.addItem,
);
router.patch(
  "/:orderId/items/:itemId",
  requireAuth,
  validate({ body: z.object({ quantity: z.number().int().min(1).max(100) }) }),
  controller.updateItemQuantity,
);
router.delete("/:orderId/items/:itemId", requireAuth, controller.removeItem);

export default router;
