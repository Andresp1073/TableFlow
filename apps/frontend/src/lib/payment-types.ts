export type PaymentTransactionStatus =
  | 'created'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type PaymentMethodType =
  | 'credit_card'
  | 'debit_card'
  | 'digital_wallet'
  | 'bank_transfer'
  | 'cash'
  | 'gift_card';

export interface PaymentTransaction {
  id: string;
  intentId: string;
  providerId: string;
  restaurantId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  methodType: string;
  providerReference: string | null;
  authorizationCode: string | null;
  capturedAmount: number | null;
  refundedAmount: number;
  refunds: Array<{
    id: string;
    amount: number;
    currency: string;
    reason: string | null;
    type: string;
    providerReference: string | null;
    createdAt: string;
  }>;
  errorMessage: string | null;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  authorizedAt: string | null;
  capturedAt: string | null;
}

export interface PaymentDashboard {
  todayRevenue: number;
  todayCount: number;
  pending: number;
  completed: number;
  refunded: number;
  failed: number;
  totalTransactions: number;
  revenueByMethod: Record<string, number>;
  recentTransactions: PaymentTransaction[];
  periodStart: string;
  periodEnd: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  displayName: string;
  status: string;
  isAvailable: boolean;
  supportedFeatures: string[];
  supportedMethods: string[];
  priority: number;
  website: string | null;
}

export interface PaymentListParams {
  status?: PaymentTransactionStatus;
  providerId?: string;
  methodType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentListResponse {
  transactions: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RefundInput {
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  transactionId: string;
  amount: number;
  type: 'full' | 'partial';
  status: string;
  newTransactionStatus: string;
  providerReference: string | null;
  remainingRefundable: number;
}

export const TRANSACTION_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  created: 'Created',
  pending: 'Pending',
  authorized: 'Authorized',
  captured: 'Captured',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  expired: 'Expired',
};

export const TRANSACTION_STATUS_VARIANTS: Record<PaymentTransactionStatus, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary'> = {
  created: 'default',
  pending: 'warning',
  authorized: 'info',
  captured: 'success',
  failed: 'danger',
  cancelled: 'secondary',
  refunded: 'info',
  expired: 'default',
};

export const TRANSACTION_STATUS_COLORS: Record<PaymentTransactionStatus, string> = {
  created: '#6b7280',
  pending: '#f59e0b',
  authorized: '#3b82f6',
  captured: '#22c55e',
  failed: '#ef4444',
  cancelled: '#8b5cf6',
  refunded: '#06b6d4',
  expired: '#9ca3af',
};

export const TRANSACTION_STATUS_OPTIONS: { value: PaymentTransactionStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'pending', label: 'Pending' },
  { value: 'authorized', label: 'Authorized' },
  { value: 'captured', label: 'Captured' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'expired', label: 'Expired' },
];

export const METHOD_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  digital_wallet: 'Digital Wallet',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  gift_card: 'Gift Card',
};

export const METHOD_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Methods' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'gift_card', label: 'Gift Card' },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
