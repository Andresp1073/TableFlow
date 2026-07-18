import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { PaymentTransaction } from '@/lib/payment-types';
import * as paymentService from '@/services/payments';
import PaymentDetailPage from '../[transactionId]/page';

const mockPayment: PaymentTransaction = {
  id: 'txn-1', intentId: 'int-1', providerId: 'stripe', restaurantId: 'rest-1',
  amount: 150.00, currency: 'USD', status: 'captured', methodType: 'credit_card',
  providerReference: 'ref-123', authorizationCode: 'AUTH001', capturedAmount: 150.00,
  refundedAmount: 0, refunds: [], errorMessage: null, metadata: {},
  createdAt: '2024-01-01T12:00:00Z', updatedAt: '2024-01-01T12:00:00Z',
  authorizedAt: '2024-01-01T12:00:00Z', capturedAt: '2024-01-01T12:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ transactionId: 'txn-1' }),
  usePathname: () => '/payments/txn-1',
}));

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent, setRestaurants } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
    setRestaurants([{ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' }]);
  }, [setCurrent, setRestaurants]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        React.createElement(RestaurantSetup, null, children),
      ),
    );
  };
}

describe('PaymentDetailPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(paymentService, 'getPayment').mockResolvedValue(mockPayment);
  });

  it('renders payment transaction title', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Payment Transaction')).toBeInTheDocument();
  });

  it('renders detail cards', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('renders status badge', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    const badges = await screen.findAllByText('Captured');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders amount information', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    const amounts = await screen.findAllByText('$150.00');
    expect(amounts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders method label', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Credit Card')).toBeInTheDocument();
  });

  it('renders provider', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('stripe')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Back to Payments')).toBeInTheDocument();
  });

  it('renders refund button for captured payments', async () => {
    render(React.createElement(PaymentDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Refund')).toBeInTheDocument();
  });
});
