import type { Response } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../middlewares/auth.js";
import { OrderManager } from "../../application/services/OrderManager.js";
import { InMemorySalesOrderRepository } from "../../infrastructure/repositories/InMemorySalesOrderRepository.js";

const orderRepo = new InMemorySalesOrderRepository();
let orderManager: OrderManager | null = null;

function getOrderManager(): OrderManager {
  if (!orderManager) {
    orderManager = new OrderManager(orderRepo);
  }
  return orderManager;
}

export function createOrderController() {
  const manager = getOrderManager();

  return {
    getDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const dashboard = await manager.getDashboard(restaurantId);
      sendSuccess(res, dashboard);
    }),

    listOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const status = req.query.status as string | undefined;
      const orders = await manager.listOrders(restaurantId, status);
      sendSuccess(res, orders);
    }),

    getOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const order = await manager.getOrder(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      sendSuccess(res, order);
    }),

    createOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const order = await manager.createOrder(restaurantId, req.body);
      res.status(201);
      sendSuccess(res, order);
    }),

    updateOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const order = await manager.updateOrder(orderId, req.body);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      sendSuccess(res, order);
    }),

    cancelOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const reason = req.body.reason ?? "Cancelled by user";
      const order = await manager.cancelOrder(orderId, reason);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      sendSuccess(res, order);
    }),

    addItem: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const item = await manager.addItem(orderId, req.body);
      if (!item) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      res.status(201);
      sendSuccess(res, item);
    }),

    updateItemQuantity: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId, itemId } = req.params;
      const { quantity } = req.body;
      const order = await manager.updateItemQuantity(orderId, itemId, quantity);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      sendSuccess(res, order);
    }),

    removeItem: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId, itemId } = req.params;
      const order = await manager.removeItem(orderId, itemId);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }
      sendSuccess(res, order);
    }),
  };
}
