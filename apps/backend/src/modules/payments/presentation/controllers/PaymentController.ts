import type { Response } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { sendSuccess } from '../../../../utils/response.js';
import type { AuthenticatedRequest } from '../../../../middlewares/auth.js';
import {
  paymentTransactionRepo,
  createPaymentManager,
  createPaymentProviderService,
  createRefundManager,
} from '../../infrastructure/repositories/store.js';
import { PaymentTransactionStatus } from '../../domain/models/PaymentTransaction.js';
import type { PaymentTransaction } from '../../domain/models/PaymentTransaction.js';

const paymentManager = createPaymentManager();
const paymentProviderService = createPaymentProviderService();
const refundManager = createRefundManager();

function transactionToDto(tx: PaymentTransaction) {
  return {
    id: tx.id,
    intentId: tx.intentId,
    providerId: tx.providerId,
    restaurantId: tx.restaurantId,
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    methodType: tx.methodType,
    providerReference: tx.providerReference,
    authorizationCode: tx.authorizationCode,
    capturedAmount: tx.capturedAmount,
    refundedAmount: tx.refundedAmount,
    refunds: tx.refunds,
    errorMessage: tx.errorMessage,
    metadata: tx.metadata,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
    authorizedAt: tx.authorizedAt?.toISOString() ?? null,
    capturedAt: tx.capturedAt?.toISOString() ?? null,
  };
}

export function createPaymentController() {
  return {
    getDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const transactions = await paymentTransactionRepo.findByRestaurant(restaurantId);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayTransactions = transactions.filter(
        (t) => new Date(t.createdAt) >= todayStart,
      );

      const todayRevenue = todayTransactions
        .filter((t) => t.status === PaymentTransactionStatus.Captured)
        .reduce((sum, t) => sum + (t.capturedAmount ?? t.amount), 0);

      const pending = transactions.filter(
        (t) => t.status === PaymentTransactionStatus.Pending || t.status === PaymentTransactionStatus.Authorized,
      ).length;

      const completed = transactions.filter(
        (t) => t.status === PaymentTransactionStatus.Captured,
      ).length;

      const refunded = transactions.filter(
        (t) => t.status === PaymentTransactionStatus.Refunded || t.refundedAmount > 0,
      ).length;

      const revenueByMethod: Record<string, number> = {};
      for (const t of transactions) {
        if (t.status === PaymentTransactionStatus.Captured) {
          revenueByMethod[t.methodType] = (revenueByMethod[t.methodType] ?? 0) + (t.capturedAmount ?? t.amount);
        }
      }

      const recentTransactions = transactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(transactionToDto);

      sendSuccess(res, {
        todayRevenue,
        todayCount: todayTransactions.length,
        pending,
        completed,
        refunded,
        failed: transactions.filter((t) => t.status === PaymentTransactionStatus.Failed).length,
        totalTransactions: transactions.length,
        revenueByMethod,
        recentTransactions,
        periodStart: todayStart.toISOString(),
        periodEnd: now.toISOString(),
      });
    }),

    listTransactions: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const {
        status,
        providerId,
        methodType,
        search,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string | undefined>;

      let transactions = await paymentTransactionRepo.findByRestaurant(restaurantId);

      if (status) {
        transactions = transactions.filter((t) => t.status === status);
      }
      if (providerId) {
        transactions = transactions.filter((t) => t.providerId === providerId);
      }
      if (methodType) {
        transactions = transactions.filter((t) => t.methodType === methodType);
      }
      if (search) {
        const q = search.toLowerCase();
        transactions = transactions.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            (t.providerReference ?? '').toLowerCase().includes(q) ||
            t.intentId.toLowerCase().includes(q),
        );
      }

      transactions.sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];
        if (aVal instanceof Date && bVal instanceof Date) {
          return (aVal.getTime() - bVal.getTime()) * dir;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * dir;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * dir;
        }
        return 0;
      });

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const total = transactions.length;
      const totalPages = Math.ceil(total / limitNum);
      const start = (pageNum - 1) * limitNum;
      const paged = transactions.slice(start, start + limitNum);

      sendSuccess(res, {
        transactions: paged.map(transactionToDto),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    }),

    getTransaction: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { transactionId } = req.params;

      const transaction = await paymentTransactionRepo.findById(transactionId);
      if (!transaction || transaction.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment transaction not found' } });
        return;
      }

      sendSuccess(res, { transaction: transactionToDto(transaction) });
    }),

    listProviders: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
      const providers = await paymentProviderService.findAll();
      sendSuccess(res, {
        providers: providers.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          status: p.status,
          isAvailable: p.isAvailable(),
          supportedFeatures: p.supportedFeatures,
          supportedMethods: p.supportedMethods,
          priority: p.priority,
          website: p.website,
        })),
      });
    }),

    refundTransaction: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { transactionId } = req.params;
      const { amount, reason } = req.body as { amount?: number; reason?: string };

      const transaction = await paymentTransactionRepo.findById(transactionId);
      if (!transaction || transaction.restaurantId !== restaurantId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment transaction not found' } });
        return;
      }

      if (transaction.status !== PaymentTransactionStatus.Captured) {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Can only refund captured transactions' } });
        return;
      }

      const refundAmount = amount ?? transaction.amount;
      const remainingRefundable = transaction.amount - transaction.refundedAmount;

      if (refundAmount <= 0 || refundAmount > remainingRefundable) {
        res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: `Refund amount must be between 0 and ${remainingRefundable}` } });
        return;
      }

      const refundType = refundAmount >= remainingRefundable ? 'full' : 'partial';
      const userId = req.user?.id ?? 'system';

      const refundRequest = await refundManager.createRefund(
        transaction,
        refundAmount,
        refundType,
        userId,
        reason,
      );

      const approved = refundRequest.approve('system');
      const result = await refundManager.processRefund(approved, transaction);

      sendSuccess(res, {
        refundId: result.refund.id,
        transactionId: result.transaction.id,
        amount: refundRequest.amount,
        type: refundType,
        status: result.refund.status,
        newTransactionStatus: result.transaction.status,
        providerReference: result.refund.providerReference,
        remainingRefundable: result.transaction.amount - result.transaction.refundedAmount,
      });
    }),
  };
}
