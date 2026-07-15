import { BasePaymentAdapter } from "../adapters/PaymentAdapter.js";
import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import type { PaymentResult } from "../../domain/models/PaymentResult.js";

export class PayPalProvider extends BasePaymentAdapter {
  readonly providerId = "paypal";
  readonly providerName = "PayPal";

  async createPayment(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createPendingResult(transaction, `pp_${transaction.id}`);
  }

  async authorize(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `pp_auth_${transaction.id}`, `auth_${transaction.id.slice(0, 8)}`);
  }

  async capture(transaction: PaymentTransaction, amount?: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `pp_cap_${transaction.id}`);
  }

  async cancel(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `pp_cancel_${transaction.id}`);
  }

  async refund(transaction: PaymentTransaction, amount: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `pp_ref_${transaction.id}`);
  }

  async verifyStatus(transaction: PaymentTransaction): Promise<{ status: PaymentTransactionStatus; providerReference: string | null }> {
    return { status: transaction.status, providerReference: transaction.providerReference };
  }
}
