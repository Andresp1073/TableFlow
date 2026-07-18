import type { Response } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../../../utils/response.js';
import type { AuthenticatedRequest } from '../../../../middlewares/auth.js';
import { InventoryManager } from '../../application/services/InventoryManager.js';
import { PurchasingService } from '../../application/services/PurchasingService.js';
import { InMemoryStockItemRepository, InMemoryIngredientRepository, InMemoryPurchaseOrderRepository } from '../../infrastructure/repositories/InMemoryInventoryRepositories.js';

export function createInventoryController() {
  const stockItemRepo = new InMemoryStockItemRepository();
  const ingredientRepo = new InMemoryIngredientRepository();
  const purchaseOrderRepo = new InMemoryPurchaseOrderRepository();
  const inventoryManager = new InventoryManager(stockItemRepo, ingredientRepo);
  const purchasingService = new PurchasingService(purchaseOrderRepo, stockItemRepo);

  return {
    /* ─── Dashboard ─── */
    getDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const stockItems = await stockItemRepo.findByRestaurant(restaurantId);
      const purchaseOrders = await purchaseOrderRepo.findByRestaurant(restaurantId);
      const summary = inventoryManager.getStockSummary(restaurantId);

      const lowStockProducts = products.filter((p) => {
        const items = stockItems.filter((si) => si.ingredientId === p.id);
        const total = items.reduce((sum, si) => sum + si.quantity, 0);
        return total < 10;
      });

      const outOfStock = products.filter((p) => {
        const items = stockItems.filter((si) => si.ingredientId === p.id);
        return items.reduce((sum, si) => sum + si.quantity, 0) === 0;
      });

      const pendingOrders = purchaseOrders.filter((po) =>
        ['Draft', 'Submitted', 'Approved'].includes(po.status)
      );

      const totalValue = stockItems.reduce((sum, si) => sum + si.quantity * si.costAtReceipt, 0);

      const recentMovements = inventoryManager['movements']
        .filter((m) => m.restaurantId === restaurantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20);

      const consumptionByProduct = inventoryManager['movements']
        .filter((m) => m.restaurantId === restaurantId && m.type === 'Consumption')
        .reduce<Record<string, { name: string; quantity: number }>>((acc, m) => {
          const ingredient = products.find((p) => p.id === m.ingredientId);
          if (!acc[m.ingredientId]) {
            acc[m.ingredientId] = { name: ingredient?.name ?? 'Unknown', quantity: 0 };
          }
          acc[m.ingredientId].quantity += Math.abs(m.quantity);
          return acc;
        }, {});

      const topConsumed = Object.values(consumptionByProduct)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      const data = {
        totalProducts: products.filter((p) => p.isActive).length,
        totalCategories: [...new Set(products.map((p) => p.category))].length,
        totalSuppliers: [...new Set(products.map((p) => p.preferredSupplierId).filter(Boolean))].length,
        totalStockValue: totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStock.length,
        pendingOrderCount: pendingOrders.length,
        lowStockProducts: lowStockProducts.map((p) => {
          const items = stockItems.filter((si) => si.ingredientId === p.id);
          const total = items.reduce((sum, si) => sum + si.quantity, 0);
          return { id: p.id, name: p.name, currentStock: total, unit: p.unit, category: p.category };
        }),
        outOfStockProducts: outOfStock.map((p) => ({ id: p.id, name: p.name, unit: p.unit })),
        pendingOrders: pendingOrders.map((po) => ({
          id: po.id,
          supplierName: po.supplierName,
          totalAmount: po.totalAmount,
          status: po.status,
          itemCount: po.items.length,
          orderedAt: po.orderedAt?.toISOString() ?? null,
          expectedDeliveryAt: po.expectedDeliveryAt?.toISOString() ?? null,
        })),
        recentMovements: recentMovements.map((m) => {
          const ingredient = products.find((p) => p.id === m.ingredientId);
          return {
            id: m.id,
            ingredientName: ingredient?.name ?? 'Unknown',
            type: m.type,
            quantity: m.quantity,
            unit: m.unit,
            createdAt: m.createdAt.toISOString(),
          };
        }),
        topConsumed,
        stockSummary: summary,
      };

      sendSuccess(res, data);
    }),

    /* ─── Products (Ingredients) ─── */
    listProducts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { search, category, isActive, page = '1', limit = '20' } = req.query as Record<string, string>;
      let products = await ingredientRepo.findByRestaurant(restaurantId);
      const stockItems = await stockItemRepo.findByRestaurant(restaurantId);

      if (search) {
        const q = search.toLowerCase();
        products = products.filter((p) => p.name.toLowerCase().includes(q));
      }
      if (category) {
        products = products.filter((p) => p.category === category);
      }
      if (isActive !== undefined) {
        products = products.filter((p) => p.isActive === (isActive === 'true'));
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const total = products.length;
      const totalPages = Math.ceil(total / limitNum);
      const start = (pageNum - 1) * limitNum;
      const paginated = products.slice(start, start + limitNum);

      const data = paginated.map((p) => {
        const items = stockItems.filter((si) => si.ingredientId === p.id);
        const currentStock = items.reduce((sum, si) => sum + si.quantity, 0);
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          costPerUnit: p.costPerUnit,
          currentStock,
          isActive: p.isActive,
          sku: p.sku ?? null,
          preferredSupplierId: p.preferredSupplierId ?? null,
          perishable: p.perishable,
          shelfLifeDays: p.shelfLifeDays ?? null,
          createdAt: '', updatedAt: '',
        };
      });

      sendPaginated(res, data, buildPaginationMeta(total, pageNum, limitNum));
    }),

    getProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, productId } = req.params;
      const product = await ingredientRepo.findById(productId);
      if (!product || product.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        return;
      }
      const stockItems = await stockItemRepo.findByIngredient(productId);
      const currentStock = stockItems.reduce((sum, si) => sum + si.quantity, 0);

      const data = {
        id: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPerUnit: product.costPerUnit,
        currentStock,
        isActive: product.isActive,
        sku: product.sku ?? null,
        preferredSupplierId: product.preferredSupplierId ?? null,
        perishable: product.perishable,
        shelfLifeDays: product.shelfLifeDays ?? null,
        storageInstructions: product.storageInstructions ?? null,
        stockItems: stockItems.map((si) => ({
          id: si.id,
          quantity: si.quantity,
          unit: si.unit,
          batchCode: si.batchCode ?? null,
          location: si.location ?? null,
          receivedAt: si.receivedAt.toISOString(),
          expiresAt: si.expiresAt?.toISOString() ?? null,
          costAtReceipt: si.costAtReceipt,
        })),
      };
      sendSuccess(res, data);
    }),

    createProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { id, name, category, unit, costPerUnit, sku, preferredSupplierId, perishable, shelfLifeDays, storageInstructions } = req.body;
      const { Ingredient, IngredientCategory, IngredientUnit } = await import('../../domain/models/Ingredient.js');
      const product = Ingredient.create({
        id: id ?? `ing_${Date.now()}`,
        restaurantId,
        name,
        category: category ?? 'RawMaterial',
        unit: unit ?? 'Units',
        costPerUnit: costPerUnit ?? 0,
        sku,
        preferredSupplierId,
        perishable: perishable ?? false,
        shelfLifeDays,
        storageInstructions,
        isActive: true,
      });
      await ingredientRepo.save(product);
      sendCreated(res, {
        id: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        costPerUnit: product.costPerUnit,
      });
    }),

    updateProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, productId } = req.params;
      const existing = await ingredientRepo.findById(productId);
      if (!existing || existing.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        return;
      }
      const { Ingredient } = await import('../../domain/models/Ingredient.js');
      const updated = Ingredient.reconstitute({
        ...existing['config'],
        ...req.body,
      });
      await ingredientRepo.save(updated);
      sendSuccess(res, { id: updated.id, name: updated.name });
    }),

    archiveProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, productId } = req.params;
      const existing = await ingredientRepo.findById(productId);
      if (!existing || existing.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        return;
      }
      const deactivated = existing.deactivate();
      await ingredientRepo.save(deactivated);
      sendSuccess(res, { id: deactivated.id, isActive: false });
    }),

    restoreProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, productId } = req.params;
      const existing = await ingredientRepo.findById(productId);
      if (!existing || existing.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Product not found' } });
        return;
      }
      const activated = existing.activate();
      await ingredientRepo.save(activated);
      sendSuccess(res, { id: activated.id, isActive: true });
    }),

    /* ─── Categories ─── */
    listCategories: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const categories = [...new Set(products.map((p) => p.category))].map((cat) => {
        const catProducts = products.filter((p) => p.category === cat);
        return {
          id: cat,
          name: cat,
          productCount: catProducts.length,
          activeCount: catProducts.filter((p) => p.isActive).length,
        };
      });
      sendSuccess(res, categories);
    }),

    /* ─── Suppliers ─── */
    listSuppliers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const supplierIds = [...new Set(products.map((p) => p.preferredSupplierId).filter(Boolean))] as string[];
      const { Supplier } = await import('../../domain/models/Supplier.js');
      const suppliers = supplierIds.map((sid, i) => Supplier.reconstitute({
        id: sid,
        restaurantId,
        name: `Supplier ${i + 1}`,
        contactName: null, email: null, phone: null, address: null,
        status: 'Active' as const,
        leadTimeDays: 3,
        minimumOrderAmount: 0,
        preferred: false,
        paymentTerms: null, notes: null,
      }));
      const data = suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        email: s.email,
        phone: s.phone,
        status: s.status,
        leadTimeDays: s.leadTimeDays,
        minimumOrderAmount: s.minimumOrderAmount,
        preferred: s.preferred,
        productCount: products.filter((p) => p.preferredSupplierId === s.id).length,
      }));
      sendSuccess(res, data);
    }),

    getSupplier: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, supplierId } = req.params;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const { Supplier } = await import('../../domain/models/Supplier.js');
      const supplier = Supplier.reconstitute({
        id: supplierId, restaurantId, name: `Supplier`,
        contactName: null, email: null, phone: null, address: null,
        status: 'Active', leadTimeDays: 3, minimumOrderAmount: 0, preferred: false,
        paymentTerms: null, notes: null,
      });
      const supplierProducts = products.filter((p) => p.preferredSupplierId === supplierId);
      sendSuccess(res, {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        status: supplier.status,
        leadTimeDays: supplier.leadTimeDays,
        minimumOrderAmount: supplier.minimumOrderAmount,
        preferred: supplier.preferred,
        paymentTerms: supplier.paymentTerms,
        notes: supplier.notes,
        products: supplierProducts.map((p) => ({ id: p.id, name: p.name, unit: p.unit, costPerUnit: p.costPerUnit })),
        purchaseOrders: [],
      });
    }),

    createSupplier: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { Supplier } = await import('../../domain/models/Supplier.js');
      const { id, name, contactName, email, phone, address, leadTimeDays, minimumOrderAmount, preferred, paymentTerms, notes } = req.body;
      const supplier = Supplier.create({
        id: id ?? `sup_${Date.now()}`,
        restaurantId,
        name,
        contactName,
        email,
        phone,
        address,
        status: 'Active',
        leadTimeDays: leadTimeDays ?? 3,
        minimumOrderAmount: minimumOrderAmount ?? 0,
        preferred: preferred ?? false,
        paymentTerms,
        notes,
      });
      sendCreated(res, { id: supplier.id, name: supplier.name, status: supplier.status });
    }),

    /* ─── Stock ─── */
    getStockSummary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const stockItems = await stockItemRepo.findByRestaurant(restaurantId);

      const data = products.filter((p) => p.isActive).map((p) => {
        const items = stockItems.filter((si) => si.ingredientId === p.id);
        const currentStock = items.reduce((sum, si) => sum + si.quantity, 0);
        const reservedStock = 0;
        const availableStock = currentStock - reservedStock;
        const avgCost = items.length > 0 ? items.reduce((sum, si) => sum + si.costAtReceipt, 0) / items.length : p.costPerUnit;
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          currentStock,
          reservedStock,
          availableStock,
          minimumStock: 10,
          maximumStock: 100,
          costPerUnit: avgCost,
          totalValue: currentStock * avgCost,
          batchCount: items.length,
          isLowStock: currentStock <= 10,
          isOverstock: currentStock >= 100,
        };
      });
      sendSuccess(res, data);
    }),

    getStockItems: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { ingredientId } = req.query as Record<string, string>;
      let items = await stockItemRepo.findByRestaurant(restaurantId);
      if (ingredientId) {
        items = items.filter((si) => si.ingredientId === ingredientId);
      }
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const data = items.map((si) => {
        const product = products.find((p) => p.id === si.ingredientId);
        return {
          id: si.id,
          ingredientId: si.ingredientId,
          ingredientName: product?.name ?? 'Unknown',
          quantity: si.quantity,
          unit: si.unit,
          location: si.location ?? null,
          batchCode: si.batchCode ?? null,
          receivedAt: si.receivedAt.toISOString(),
          expiresAt: si.expiresAt?.toISOString() ?? null,
          costAtReceipt: si.costAtReceipt,
          isLowStock: si.isLowStock(10),
          isExpired: si.isExpired(),
          daysUntilExpiry: si.daysUntilExpiry(),
        };
      });
      sendSuccess(res, data);
    }),

    /* ─── Stock Movements ─── */
    listStockMovements: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { type, ingredientId, page = '1', limit = '20' } = req.query as Record<string, string>;
      let movements = inventoryManager['movements']
        .filter((m) => m.restaurantId === restaurantId);

      if (type) {
        movements = movements.filter((m) => m.type === type);
      }
      if (ingredientId) {
        movements = movements.filter((m) => m.ingredientId === ingredientId);
      }

      movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const total = movements.length;
      const start = (pageNum - 1) * limitNum;
      const paginated = movements.slice(start, start + limitNum);

      const data = paginated.map((m) => {
        const product = products.find((p) => p.id === m.ingredientId);
        return {
          id: m.id,
          ingredientId: m.ingredientId,
          ingredientName: product?.name ?? 'Unknown',
          type: m.type,
          quantity: m.quantity,
          unit: m.unit,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
          reason: m.reason ?? null,
          performedBy: m.performedBy,
          createdAt: m.createdAt.toISOString(),
          isIncrease: m.isIncrease(),
          isDecrease: m.isDecrease(),
        };
      });
      sendPaginated(res, data, buildPaginationMeta(total, pageNum, limitNum));
    }),

    /* ─── Purchase Orders ─── */
    listPurchaseOrders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { status, supplierId, page = '1', limit = '20' } = req.query as Record<string, string>;
      let orders = await purchaseOrderRepo.findByRestaurant(restaurantId);
      if (status) {
        orders = orders.filter((po) => po.status === status);
      }
      if (supplierId) {
        orders = orders.filter((po) => po.supplierId === supplierId);
      }
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const total = orders.length;
      const start = (pageNum - 1) * limitNum;
      const paginated = orders.slice(start, start + limitNum);
      const data = paginated.map((po) => ({
        id: po.id,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        status: po.status,
        totalAmount: po.totalAmount,
        itemCount: po.items.length,
        receivedCount: po.getReceivedItemsCount(),
        isFullyReceived: po.isFullyReceived(),
        notes: po.notes,
        orderedAt: po.orderedAt?.toISOString() ?? null,
        expectedDeliveryAt: po.expectedDeliveryAt?.toISOString() ?? null,
        receivedAt: po.receivedAt?.toISOString() ?? null,
        createdBy: po.createdBy,
        approvedBy: po.approvedBy ?? null,
        createdAt: po.createdAt.toISOString(),
        updatedAt: po.updatedAt.toISOString(),
      }));
      sendPaginated(res, data, buildPaginationMeta(total, pageNum, limitNum));
    }),

    getPurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, orderId } = req.params;
      const po = await purchaseOrderRepo.findById(orderId);
      if (!po || po.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Purchase order not found' } });
        return;
      }
      sendSuccess(res, {
        id: po.id,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        status: po.status,
        items: po.items.map((item) => ({
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          receivedQuantity: item.receivedQuantity,
        })),
        totalAmount: po.totalAmount,
        itemCount: po.items.length,
        receivedCount: po.getReceivedItemsCount(),
        isFullyReceived: po.isFullyReceived(),
        outstandingItems: po.getOutstandingItems(),
        notes: po.notes,
        orderedAt: po.orderedAt?.toISOString() ?? null,
        expectedDeliveryAt: po.expectedDeliveryAt?.toISOString() ?? null,
        receivedAt: po.receivedAt?.toISOString() ?? null,
        createdBy: po.createdBy,
        approvedBy: po.approvedBy ?? null,
        createdAt: po.createdAt.toISOString(),
        updatedAt: po.updatedAt.toISOString(),
        canTransitionTo: ['Draft', 'Submitted', 'Approved', 'Received', 'Cancelled'].filter((s) => po.canTransitionTo(s as any)),
      });
    }),

    createPurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const po = await purchasingService.createPurchaseOrder({
        ...req.body,
        id: `po_${Date.now()}`,
        restaurantId,
      });
      sendCreated(res, { id: po.id, status: po.status, totalAmount: po.totalAmount });
    }),

    submitPurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const po = await purchasingService.submitOrder(orderId);
      sendSuccess(res, { id: po.id, status: po.status });
    }),

    approvePurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const po = await purchasingService.approveOrder(orderId, req.userId!);
      sendSuccess(res, { id: po.id, status: po.status });
    }),

    receivePurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const { receivedItems } = req.body;
      const po = await purchasingService.receiveOrder(orderId, receivedItems);
      sendSuccess(res, { id: po.id, status: po.status, receivedCount: po.getReceivedItemsCount() });
    }),

    cancelPurchaseOrder: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { orderId } = req.params;
      const { reason } = req.body;
      const po = await purchasingService.cancelOrder(orderId, reason);
      sendSuccess(res, { id: po.id, status: po.status });
    }),

    /* ─── Receiving ─── */
    receiveStock: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { items, notes } = req.body;
      const results = [];
      for (const item of items) {
        const result = await inventoryManager.addStock({
          restaurantId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          costAtReceipt: item.costAtReceipt ?? 0,
          batchCode: item.batchCode,
          location: item.location,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
          performedBy: req.userId!,
          referenceId: item.purchaseOrderId,
        });
        results.push({
          stockItemId: result.stockItem.id,
          movementId: result.movement.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        });
      }
      sendCreated(res, { received: results.length, items: results, notes: notes ?? null });
    }),

    /* ─── Alerts ─── */
    getAlerts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const products = await ingredientRepo.findByRestaurant(restaurantId);
      const stockItems = await stockItemRepo.findByRestaurant(restaurantId);
      const purchaseOrders = await purchaseOrderRepo.findByRestaurant(restaurantId);

      const lowStock = products
        .filter((p) => p.isActive)
        .map((p) => {
          const items = stockItems.filter((si) => si.ingredientId === p.id);
          const currentStock = items.reduce((sum, si) => sum + si.quantity, 0);
          return { id: p.id, name: p.name, currentStock, unit: p.unit, category: p.category };
        })
        .filter((p) => p.currentStock <= 10);

      const expiredItems = stockItems.filter((si) => si.isExpired());
      const expiringSoon = stockItems.filter((si) => {
        const days = si.daysUntilExpiry();
        return days !== null && days >= 0 && days <= 7;
      });

      const pendingReceiving = purchaseOrders.filter((po) =>
        po.status === 'Approved' || po.status === 'Submitted'
      );

      const outOfStock = products
        .filter((p) => p.isActive)
        .map((p) => {
          const items = stockItems.filter((si) => si.ingredientId === p.id);
          const currentStock = items.reduce((sum, si) => sum + si.quantity, 0);
          return { id: p.id, name: p.name, currentStock, unit: p.unit };
        })
        .filter((p) => p.currentStock === 0);

      sendSuccess(res, {
        lowStock: lowStock.map((p) => ({
          id: p.id, name: p.name, currentStock: p.currentStock, unit: p.unit, category: p.category,
        })),
        outOfStock: outOfStock.map((p) => ({
          id: p.id, name: p.name, unit: p.unit,
        })),
        expired: expiredItems.map((si) => {
          const p = products.find((pr) => pr.id === si.ingredientId);
          return {
            id: si.id, ingredientId: si.ingredientId, ingredientName: p?.name ?? 'Unknown',
            quantity: si.quantity, unit: si.unit, batchCode: si.batchCode, expiresAt: si.expiresAt?.toISOString(),
          };
        }),
        expiringSoon: expiringSoon.map((si) => {
          const p = products.find((pr) => pr.id === si.ingredientId);
          return {
            id: si.id, ingredientId: si.ingredientId, ingredientName: p?.name ?? 'Unknown',
            quantity: si.quantity, unit: si.unit, expiresAt: si.expiresAt?.toISOString(),
            daysUntilExpiry: si.daysUntilExpiry(),
          };
        }),
        pendingReceiving: pendingReceiving.map((po) => ({
          id: po.id, supplierName: po.supplierName, status: po.status,
          itemCount: po.items.length, totalAmount: po.totalAmount,
          expectedDeliveryAt: po.expectedDeliveryAt?.toISOString() ?? null,
        })),
        totalLowStock: lowStock.length,
        totalOutOfStock: outOfStock.length,
        totalExpired: expiredItems.length,
        totalExpiringSoon: expiringSoon.length,
        totalPendingReceiving: pendingReceiving.length,
      });
    }),
  };
}
