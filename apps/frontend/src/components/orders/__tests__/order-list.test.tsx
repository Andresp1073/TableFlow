import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderList } from '../order-list';
import type { SalesOrder } from '@/lib/sales-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

function createOrder(id: string, overrides: Partial<SalesOrder> = {}): SalesOrder {
  return {
    id,
    restaurantId: 'rest-1',
    tableId: null,
    customerId: null,
    customerName: null,
    customerCount: null,
    status: 'draft',
    source: 'pos',
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 25.5,
    paymentStatus: 'unpaid',
    paymentTransactionId: null,
    posReference: null,
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    ...overrides,
  };
}

describe('OrderList', () => {
  it('shows loading state', () => {
    render(
      <OrderList
        orders={undefined}
        isLoading={true}
        isError={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <OrderList
        orders={undefined}
        isLoading={false}
        isError={true}
        error={new Error('Network error')}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(
      <OrderList
        orders={[]}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('renders order cards', () => {
    const orders = [
      createOrder('order-1', { status: 'draft', total: 15.99 }),
      createOrder('order-2', { status: 'completed', total: 42.5 }),
    ];
    render(
      <OrderList
        orders={orders}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('article').length).toBe(2);
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('$42.50')).toBeInTheDocument();
  });
});
