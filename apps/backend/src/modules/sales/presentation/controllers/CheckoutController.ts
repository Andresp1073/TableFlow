import type { Response } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../middlewares/auth.js";
import { OrderManager } from "../../application/services/OrderManager.js";
import { InMemorySalesOrderRepository } from "../../infrastructure/repositories/InMemorySalesOrderRepository.js";
import {
  createPaymentManager,
  createPaymentProviderService,
} from "../../../payments/infrastructure/repositories/store.js";
import { KitchenManager } from "../../../kitchen/application/services/KitchenManager.js";
import { InMemoryKitchenTicketRepository, InMemoryKitchenStationRepository } from "../../../kitchen/infrastructure/repositories/InMemoryKitchenRepositories.js";
import { PaymentIntent } from "../../../payments/domain/models/PaymentIntent.js";

const orderRepo = new InMemorySalesOrderRepository();
const kitchenTicketRepo = new InMemoryKitchenTicketRepository();
const kitchenStationRepo = new InMemoryKitchenStationRepository();

let orderManager: OrderManager | null = null;
let paymentManager: PaymentManager | null = null;
let paymentProviderService: PaymentProviderService | null = null;
let kitchenManager: KitchenManager | null = null;

function getOrderManager(): OrderManager {
  if (!orderManager) orderManager = new OrderManager(orderRepo);
  return orderManager;
}

function getPaymentManager(): ReturnType<typeof createPaymentManager> {
  if (!paymentManager) paymentManager = createPaymentManager();
  return paymentManager;
}

function getPaymentProviderService(): ReturnType<typeof createPaymentProviderService> {
  if (!paymentProviderService) paymentProviderService = createPaymentProviderService();
  return paymentProviderService;
}

function getKitchenManager(): KitchenManager {
  if (!kitchenManager) {
    kitchenManager = new KitchenManager(kitchenTicketRepo, kitchenStationRepo);
  }
  return kitchenManager;
}

export function createCheckoutController() {
  return {
    submitOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { orderId } = req.params;
      const { kitchenId } = req.body;

      const manager = getOrderManager();
      const orderDto = await manager.getOrder(orderId);
      if (!orderDto) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }

      const order = await orderRepo.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }

      const validation = order.items.length === 0;
      if (validation) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Cannot submit order with no items" } });
        return;
      }

      const submitted = order.submit();
      await orderRepo.save(submitted);

      const km = getKitchenManager();
      const itemsByStation = new Map<string, typeof order.items[number][]>();
      for (const item of order.items) {
        const stationId = item.stationId ?? "default";
        if (!itemsByStation.has(stationId)) itemsByStation.set(stationId, []);
        itemsByStation.get(stationId)!.push(item);
      }

      const ticketIds: string[] = [];
      for (const [stationId, stationItems] of itemsByStation) {
        try {
          const ticket = await km.createTicket({
            id: crypto.randomUUID(),
            restaurantId,
            kitchenId,
            orderId: order.id,
            stationId,
            tableId: order.tableId ?? undefined,
            customerName: order.customerName ?? undefined,
            customerCount: order.customerCount ?? undefined,
            priority: "normal",
            items: stationItems.map((item) => ({
              id: crypto.randomUUID(),
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              quantity: item.quantity,
              stationId: item.stationId ?? stationId,
              modifiers: [...item.modifiers],
              notes: item.notes ?? undefined,
            })),
          });
          ticketIds.push(ticket.id);
        } catch {
          // Station might not exist; skip
        }
      }

      sendSuccess(res, {
        orderId: order.id,
        status: submitted.status,
        total: submitted.total,
        kitchenTickets: ticketIds,
        ticketCount: ticketIds.length,
      });
    }),

    processPayment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { orderId } = req.params;
      const { providerId, methodType, tipAmount = 0 } = req.body;

      const order = await orderRepo.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }

      if (order.paymentStatus === "paid") {
        res.status(400).json({ success: false, error: { code: "ALREADY_PAID", message: "Order has already been paid" } });
        return;
      }

      const pm = getPaymentManager();
      const pps = getPaymentProviderService();

      const providers = await pps.findAvailable();
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) {
        res.status(400).json({ success: false, error: { code: "PROVIDER_NOT_FOUND", message: `Payment provider not found: ${providerId}` } });
        return;
      }

      const totalWithTip = order.total + tipAmount;

      const intent = PaymentIntent.create({
        id: crypto.randomUUID(),
        amount: totalWithTip,
        currency: "USD",
        reference: `ORDER-${order.id}`,
        customerId: order.customerId ?? undefined,
        customerEmail: undefined,
        restaurantId,
        reservationId: undefined,
        description: `Payment for order ${order.id}`,
        allowedMethods: [methodType],
        metadata: { orderId: order.id },
        expiresAt: new Date(Date.now() + 3600000),
      });

      const transaction = await pm.createTransaction(intent, providerId, methodType);

      if (transaction.status === "failed" as any) {
        res.status(402).json({ success: false, error: { code: "PAYMENT_FAILED", message: transaction.errorMessage ?? "Payment failed" } });
        return;
      }

      const authorized = await pm.authorize(transaction);

      if (authorized.status === "failed" as any) {
        res.status(402).json({ success: false, error: { code: "PAYMENT_FAILED", message: authorized.errorMessage ?? "Authorization failed" } });
        return;
      }

      const captured = await pm.capture(authorized, totalWithTip);

      if (captured.status === "failed" as any) {
        res.status(402).json({ success: false, error: { code: "CAPTURE_FAILED", message: captured.errorMessage ?? "Capture failed" } });
        return;
      }

      const completed = order.complete(captured.id);
      await orderRepo.save(completed);

      sendSuccess(res, {
        orderId: order.id,
        status: completed.status,
        paymentStatus: completed.paymentStatus,
        paymentTransactionId: captured.id,
        total: order.total,
        paid: totalWithTip,
        tip: tipAmount,
        change: 0,
        providerReference: captured.providerReference,
      });
    }),

    getOrderStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const order = await orderRepo.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
        return;
      }

      const km = getKitchenManager();
      const kitchenTickets = await kitchenTicketRepo.findByKitchen(order.restaurantId);

      sendSuccess(res, {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        itemCount: order.items.length,
        kitchenTickets: kitchenTickets
          .filter((t) => t.orderId === order.id)
          .map((t) => ({
            id: t.id,
            status: t.status,
            stationId: t.stationId,
          })),
      });
    }),
  };
}
