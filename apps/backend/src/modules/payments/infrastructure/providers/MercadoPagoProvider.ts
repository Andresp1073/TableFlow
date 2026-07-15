import { BasePaymentAdapter } from "../adapters/PaymentAdapter.js";
import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import type { PaymentResult } from "../../domain/models/PaymentResult.js";

export class MercadoPagoProvider extends BasePaymentAdapter {
  readonly providerId = "mercadopago";
  readonly providerName = "Mercado Pago";

  async createPayment(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `mp_${transaction.id}`);
  }

  async authorize(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `mp_auth_${transaction.id}`, `auth_${transaction.id.slice(0, 8)}`);
  }

  async capture(transaction: PaymentTransaction, amount?: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `mp_cap_${transaction.id}`);
  }

  async cancel(transaction: PaymentTransaction): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `mp_cancel_${transaction.id}`);
  }

  async refund(transaction: PaymentTransaction, amount: number): Promise<PaymentResult> {
    return this.createSuccessResult(transaction, `mp_ref_${transaction.id}`);
  }

  async verifyStatus(transaction: PaymentTransaction): Promise<{ status: PaymentTransactionStatus; providerReference: string | null }> {
    return { status: transaction.status, providerReference: transaction.providerReference };
  }
}
