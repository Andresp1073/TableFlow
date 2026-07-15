import type { PaymentTransaction } from "../../domain/models/PaymentTransaction.js";
import type { PaymentTransactionStatus } from "../../domain/models/PaymentTransaction.js";
import { PaymentResult } from "../../domain/models/PaymentResult.js";
import { PaymentResultStatus } from "../../domain/models/PaymentResult.js";

export interface PaymentAdapter {
  readonly providerId: string;
  readonly providerName: string;

  createPayment(transaction: PaymentTransaction): Promise<PaymentResult>;
  authorize(transaction: PaymentTransaction): Promise<PaymentResult>;
  capture(transaction: PaymentTransaction, amount?: number): Promise<PaymentResult>;
  cancel(transaction: PaymentTransaction): Promise<PaymentResult>;
  refund(transaction: PaymentTransaction, amount: number): Promise<PaymentResult>;
  verifyStatus(transaction: PaymentTransaction): Promise<{ status: PaymentTransactionStatus; providerReference: string | null }>;
}

export abstract class BasePaymentAdapter implements PaymentAdapter {
  abstract readonly providerId: string;
  abstract readonly providerName: string;

  abstract createPayment(transaction: PaymentTransaction): Promise<PaymentResult>;
  abstract authorize(transaction: PaymentTransaction): Promise<PaymentResult>;
  abstract capture(transaction: PaymentTransaction, amount?: number): Promise<PaymentResult>;
  abstract cancel(transaction: PaymentTransaction): Promise<PaymentResult>;
  abstract refund(transaction: PaymentTransaction, amount: number): Promise<PaymentResult>;
  abstract verifyStatus(transaction: PaymentTransaction): Promise<{ status: PaymentTransactionStatus; providerReference: string | null }>;

  protected createSuccessResult(
    transaction: PaymentTransaction,
    providerReference: string,
    authorizationCode?: string,
  ): PaymentResult {
    return PaymentResult.create({
      status: PaymentResultStatus.Success,
      transactionId: transaction.id,
      providerReference,
      authorizationCode: authorizationCode ?? null,
      amount: transaction.amount,
      currency: transaction.currency,
      feeAmount: null,
      errorMessage: null,
      errorCode: null,
      requiresRedirect: false,
      redirectUrl: null,
      rawResponse: null,
      processedAt: new Date(),
    });
  }

  protected createFailureResult(
    transaction: PaymentTransaction,
    errorMessage: string,
    errorCode?: string,
  ): PaymentResult {
    return PaymentResult.create({
      status: PaymentResultStatus.Failure,
      transactionId: transaction.id,
      providerReference: "",
      authorizationCode: null,
      amount: transaction.amount,
      currency: transaction.currency,
      feeAmount: null,
      errorMessage,
      errorCode: errorCode ?? null,
      requiresRedirect: false,
      redirectUrl: null,
      rawResponse: null,
      processedAt: new Date(),
    });
  }

  protected createPendingResult(
    transaction: PaymentTransaction,
    providerReference: string,
  ): PaymentResult {
    return PaymentResult.create({
      status: PaymentResultStatus.Pending,
      transactionId: transaction.id,
      providerReference,
      authorizationCode: null,
      amount: transaction.amount,
      currency: transaction.currency,
      feeAmount: null,
      errorMessage: null,
      errorCode: null,
      requiresRedirect: false,
      redirectUrl: null,
      rawResponse: null,
      processedAt: new Date(),
    });
  }
}
