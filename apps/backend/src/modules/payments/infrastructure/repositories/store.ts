import { InMemoryPaymentTransactionRepository, InMemoryPaymentProviderRepository } from './InMemoryPaymentRepositories.js';
import { PaymentProvider } from '../../domain/models/PaymentProvider.js';
import { PaymentProviderStatus } from '../../domain/models/PaymentProvider.js';
import type { PaymentProviderFeature } from '../../domain/models/PaymentProvider.js';
import { PaymentManager } from '../../application/services/PaymentManager.js';
import { PaymentProviderService } from '../../application/services/PaymentProviderService.js';
import { RefundManager } from '../../application/services/RefundManager.js';
import { StripeProvider } from '../providers/StripeProvider.js';
import { AdyenProvider } from '../providers/AdyenProvider.js';
import { MercadoPagoProvider } from '../providers/MercadoPagoProvider.js';
import { SquarePaymentsProvider } from '../providers/SquarePaymentsProvider.js';
import { PayPalProvider } from '../providers/PayPalProvider.js';
import { BankProvider } from '../providers/BankProvider.js';

export const paymentTransactionRepo = new InMemoryPaymentTransactionRepository();
export const paymentProviderRepo = new InMemoryPaymentProviderRepository();

const PROVIDERS: Array<{
  id: string;
  name: string;
  displayName: string;
  supportedFeatures: PaymentProviderFeature[];
  supportedMethods: string[];
  priority: number;
  website?: string;
}> = [
  {
    id: 'stripe',
    name: 'Stripe',
    displayName: 'Stripe',
    supportedFeatures: ['create_payment', 'authorize_payment', 'capture_payment', 'cancel_payment', 'refund_payment', 'verify_status', 'tokenization', 'partial_refund'],
    supportedMethods: ['credit_card', 'debit_card', 'digital_wallet'],
    priority: 1,
    website: 'https://stripe.com',
  },
  {
    id: 'square_payments',
    name: 'Square',
    displayName: 'Square Payments',
    supportedFeatures: ['create_payment', 'authorize_payment', 'capture_payment', 'cancel_payment', 'refund_payment', 'verify_status', 'partial_refund'],
    supportedMethods: ['credit_card', 'debit_card', 'digital_wallet', 'gift_card'],
    priority: 2,
    website: 'https://squareup.com',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    supportedFeatures: ['create_payment', 'authorize_payment', 'capture_payment', 'cancel_payment', 'refund_payment', 'verify_status', 'partial_refund'],
    supportedMethods: ['digital_wallet', 'credit_card'],
    priority: 3,
    website: 'https://paypal.com',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    displayName: 'Bank Transfer',
    supportedFeatures: ['create_payment', 'authorize_payment', 'capture_payment', 'cancel_payment', 'refund_payment', 'verify_status'],
    supportedMethods: ['bank_transfer'],
    priority: 4,
  },
  {
    id: 'cash',
    name: 'Cash',
    displayName: 'Cash',
    supportedFeatures: ['create_payment', 'capture_payment'],
    supportedMethods: ['cash'],
    priority: 5,
  },
];

export async function initializePaymentStore(): Promise<void> {
  for (const config of PROVIDERS) {
    const existing = await paymentProviderRepo.findById(config.id);
    if (!existing) {
      const provider = PaymentProvider.create({
        ...config,
        status: PaymentProviderStatus.Active,
        isEnabled: true,
      });
      await paymentProviderRepo.save(provider);
    }
  }
}

export function createPaymentManager(): PaymentManager {
  const pm = new PaymentManager(
    paymentTransactionRepo,
    paymentProviderRepo,
    { publish: () => {} },
  );
  pm.registerAdapter('stripe', new StripeProvider());
  pm.registerAdapter('adyen', new AdyenProvider());
  pm.registerAdapter('mercadopago', new MercadoPagoProvider());
  pm.registerAdapter('square_payments', new SquarePaymentsProvider());
  pm.registerAdapter('paypal', new PayPalProvider());
  pm.registerAdapter('bank_transfer', new BankProvider());
  pm.registerAdapter('cash', new StripeProvider());
  return pm;
}

export function createRefundManager(): RefundManager {
  const rm = new RefundManager(
    paymentTransactionRepo,
    { publish: () => {} },
  );
  rm.registerAdapter('stripe', new StripeProvider());
  rm.registerAdapter('adyen', new AdyenProvider());
  rm.registerAdapter('mercadopago', new MercadoPagoProvider());
  rm.registerAdapter('square_payments', new SquarePaymentsProvider());
  rm.registerAdapter('paypal', new PayPalProvider());
  rm.registerAdapter('bank_transfer', new BankProvider());
  return rm;
}

export function createPaymentProviderService(): PaymentProviderService {
  return new PaymentProviderService(paymentProviderRepo);
}
