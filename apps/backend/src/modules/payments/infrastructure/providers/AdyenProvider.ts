import { BasePaymentAdapter } from "../adapters/PaymentAdapter.js";
import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import type { PaymentResult } from "../../domain/models/PaymentResult.js";

export class AdyenProvider extends BasePaymentAdapter {
  readonly providerId = "adyen";
  readonly providerName = "Adyen";

  async createPayment(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `adyen_${transaction.id}`);
  }

  async authorize(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `adyen_auth_${transaction.id}`, `auth_${transaction.id.slice(0, 8)}`);
  }

  async capture(transaction: PaymentTransaction, amount?: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `adyen_cap_${transaction.id}`);
  }

  async cancel(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `adyen_cancel_${transaction.id}`);
  }

  async refund(transaction: PaymentTransaction, amount: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `adyen_ref_${transaction.id}`);
  }

  async verifyStatus(transaction: PaymentTransaction): Promise<{ status: PaymentTransactionStatus; providerReference: string | null }> {
    return { status: transaction.status, providerReference: transaction.providerReference };
  }
}
