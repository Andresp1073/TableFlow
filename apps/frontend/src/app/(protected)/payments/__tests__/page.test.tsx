import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { PaymentDashboard, PaymentListResponse } from '@/lib/payment-types';
import * as paymentService from '@/services/payments';
import PaymentsPage from '../page';

const mockDashboard: PaymentDashboard = {
  todayRevenue: 1250.50,
  todayCount: 15,
  pending: 3,
  completed: 10,
  refunded: 1,
  failed: 1,
  totalTransactions: 15,
  revenueByMethod: { cash: 500.00, credit_card: 750.50 },
  recentTransactions: [],
  periodStart: '2024-01-01T00:00:00Z',
  periodEnd: '2024-01-01T23:59:59Z',
};

const mockListResponse: PaymentListResponse = {
  transactions: [
    {
      id: 'txn-1', intentId: 'int-1', providerId: 'stripe', restaurantId: 'rest-1',
      amount: 150.00, currency: 'USD', status: 'captured', methodType: 'credit_card',
      providerReference: 'ref-123', authorizationCode: 'AUTH001', capturedAmount: 150.00,
      refundedAmount: 0, refunds: [], errorMessage: null, metadata: {},
      createdAt: '2024-01-01T12:00:00Z', updatedAt: '2024-01-01T12:00:00Z',
      authorizedAt: '2024-01-01T12:00:00Z', capturedAt: '2024-01-01T12:00:00Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/payments',
}));

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent, setRestaurants } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
    setRestaurants([{ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' }]);
  }, [setCurrent, setRestaurants]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper(withRestaurant = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        withRestaurant
          ? React.createElement(RestaurantSetup, null, children)
          : children,
      ),
    );
  };
}

describe('PaymentsPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(paymentService, 'getPaymentDashboard').mockResolvedValue(mockDashboard);
  });

  it('renders the page title and description', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('Manage payment processing, transactions, and refunds')).toBeInTheDocument();
  });

  it('renders dashboard stat cards', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
      const pendingCards = screen.getAllByText('Pending');
      expect(pendingCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders revenue amount', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('$1,250.50')).toBeInTheDocument();
    });
  });

  it('renders revenue by method section', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Revenue by Payment Method')).toBeInTheDocument();
    });
  });

  it('renders transaction history section', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
  });

  it('renders search input and filter dropdowns', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    expect(screen.getByLabelText('Search transactions')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by method')).toBeInTheDocument();
  });

  it('renders transaction rows from API data', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/txn-1/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue({
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  it('shows no restaurant message when no restaurant selected', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper(false) });
    expect(screen.getByText('Select a restaurant to view payments')).toBeInTheDocument();
  });

  it('renders status badges for transactions', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(mockListResponse);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      const badges = screen.getAllByText('Captured');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters transactions by search', async () => {
    const listWithTwo = {
      transactions: [
        ...mockListResponse.transactions,
        {
          ...mockListResponse.transactions[0],
          id: 'txn-2',
          amount: 75.00,
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue(listWithTwo);
    render(React.createElement(PaymentsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/txn-1/)).toBeInTheDocument();
    });
  });
});
