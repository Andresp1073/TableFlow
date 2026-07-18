import { Router } from "express";
import { requireAuth } from "../../../../middlewares/auth.js";
import { validate } from "../../../../middlewares/validate.js";
import { createCheckoutController } from "../controllers/CheckoutController.js";
import { SubmitOrderSchema, ProcessPaymentSchema } from "../../application/dtos/index.js";
import { z } from "zod";

const controller = createCheckoutController();

const router = Router({ mergeParams: true });

router.post(
  "/:orderId/submit",
  requireAuth,
  validate({ body: SubmitOrderSchema }),
  controller.submitOrder,
);

router.post(
  "/:orderId/pay",
  requireAuth,
  validate({ body: ProcessPaymentSchema }),
  controller.processPayment,
);

router.get("/:orderId/status", requireAuth, controller.getOrderStatus);

export default router;
