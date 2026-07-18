import type { SalesOrderRepository } from "../../domain/repositories/SalesOrderRepository.js";
import { SalesOrder } from "../../domain/models/SalesOrder.js";
import { OrderItem } from "../../domain/models/OrderItem.js";
import { OrderCalculator } from "../../domain/services/OrderCalculator.js";
import { OrderValidator } from "../../domain/services/OrderValidator.js";
import type { CreateOrderDto, CreateOrderItemDto } from "../dtos/CreateOrderDto.js";
import type { UpdateOrderDto } from "../dtos/UpdateOrderDto.js";
import type { OrderDto, OrderItemDto, OrderDashboardDto } from "../dtos/OrderDto.js";
import { OrderStatus } from "../../domain/models/OrderStatus.js";

export class OrderManager {
  private readonly calculator: OrderCalculator;
  private readonly validator: OrderValidator;

  constructor(
    private readonly orderRepository: SalesOrderRepository,
  ) {
    this.calculator = new OrderCalculator();
    this.validator = new OrderValidator();
  }

  async createOrder(restaurantId: string, dto: CreateOrderDto): Promise<OrderDto> {
    const order = SalesOrder.create({
      id: crypto.randomUUID(),
      restaurantId,
      tableId: dto.tableId ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName ?? null,
      customerCount: dto.customerCount ?? null,
      source: dto.source ?? "pos",
    });

    let withItems = order;
    for (const itemDto of dto.items ?? []) {
      const item = OrderItem.create({
        id: crypto.randomUUID(),
        orderId: withItems.id,
        menuItemId: itemDto.menuItemId,
        menuItemName: itemDto.menuItemName,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        modifiers: itemDto.modifiers ?? [],
        notes: itemDto.notes ?? null,
        stationId: itemDto.stationId ?? null,
      });
      withItems = withItems.addItem(item);
    }

    const notes = dto.notes ?? [];
    let finalOrder = withItems;
    for (const note of notes) {
      finalOrder = finalOrder.addNote(note);
    }

    await this.orderRepository.save(finalOrder);
    return this.toDto(finalOrder);
  }

  async getOrder(orderId: string): Promise<OrderDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;
    return this.toDto(order);
  }

  async listOrders(restaurantId: string, status?: string): Promise<OrderDto[]> {
    let orders: SalesOrder[];
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      orders = await this.orderRepository.findByStatus(restaurantId, status as OrderStatus);
    } else {
      const all = await this.orderRepository.findByRestaurant(restaurantId);
      orders = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return orders.map((o) => this.toDto(o));
  }

  async updateOrder(orderId: string, dto: UpdateOrderDto): Promise<OrderDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    let updated = SalesOrder.reconstitute({
      ...order.value,
      tableId: dto.tableId !== undefined ? dto.tableId : order.tableId,
      customerId: dto.customerId !== undefined ? dto.customerId : order.customerId,
      customerName: dto.customerName !== undefined ? dto.customerName : order.customerName,
      customerCount: dto.customerCount !== undefined ? dto.customerCount : order.customerCount,
      notes: dto.notes !== undefined ? dto.notes : [...order.notes],
      updatedAt: new Date(),
    });

    await this.orderRepository.save(updated);
    return this.toDto(updated);
  }

  async addItem(orderId: string, dto: CreateOrderItemDto): Promise<OrderItemDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    const item = OrderItem.create({
      id: crypto.randomUUID(),
      orderId: order.id,
      menuItemId: dto.menuItemId,
      menuItemName: dto.menuItemName,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      modifiers: dto.modifiers ?? [],
      notes: dto.notes ?? null,
      stationId: dto.stationId ?? null,
    });

    const updated = order.addItem(item);
    await this.orderRepository.save(updated);
    return this.toItemDto(item);
  }

  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantity: number,
  ): Promise<OrderDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    const updated = order.updateItem(itemId, (item) => item.withQuantity(quantity));
    await this.orderRepository.save(updated);
    return this.toDto(updated);
  }

  async removeItem(orderId: string, itemId: string): Promise<OrderDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    const updated = order.removeItem(itemId);
    await this.orderRepository.save(updated);
    return this.toDto(updated);
  }

  async cancelOrder(orderId: string, reason: string): Promise<OrderDto | null> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    const cancelled = order.cancel(reason);
    await this.orderRepository.save(cancelled);
    return this.toDto(cancelled);
  }

  async getDashboard(restaurantId: string): Promise<OrderDashboardDto> {
    const orders = await this.orderRepository.findByRestaurant(restaurantId);
    const active = orders.filter(
      (o) => o.status !== OrderStatus.Completed && o.status !== OrderStatus.Cancelled,
    );
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = orders
      .filter((o) => o.status === OrderStatus.Completed && o.completedAt && o.completedAt >= todayStart)
      .reduce((sum, o) => sum + o.total, 0);

    return {
      total: orders.length,
      active: active.length,
      submitted: orders.filter((o) => o.status === OrderStatus.Submitted).length,
      inProgress: orders.filter((o) => o.status === OrderStatus.InProgress).length,
      ready: orders.filter((o) => o.status === OrderStatus.Ready).length,
      completed: orders.filter((o) => o.status === OrderStatus.Completed).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.Cancelled).length,
      todayRevenue,
    };
  }

  private toDto(order: SalesOrder): OrderDto {
    return {
      id: order.id,
      restaurantId: order.restaurantId,
      tableId: order.tableId,
      customerId: order.customerId,
      customerName: order.customerName,
      customerCount: order.customerCount,
      status: order.status,
      source: order.source,
      items: order.items.map((item) => this.toItemDto(item)),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      paymentStatus: order.paymentStatus,
      paymentTransactionId: order.paymentTransactionId,
      posReference: order.posReference,
      notes: [...order.notes],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      submittedAt: order.submittedAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancellationReason: order.cancellationReason,
    };
  }

  private toItemDto(item: OrderItem): OrderItemDto {
    return {
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      modifiers: [...item.modifiers],
      notes: item.notes,
      stationId: item.stationId,
    };
  }
}
