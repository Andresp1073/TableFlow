import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderDetailView } from '../order-detail-view';
import type { SalesOrder } from '@/lib/sales-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

function createOrder(id: string, overrides: Partial<SalesOrder> = {}): SalesOrder {
  return {
    id,
    restaurantId: 'rest-1',
    tableId: 'T-05',
    customerId: null,
    customerName: 'John',
    customerCount: 2,
    status: 'draft',
    source: 'pos',
    items: [
      { id: 'item-1', orderId: id, menuItemId: 'm1', menuItemName: 'Burger', quantity: 2, unitPrice: 12.99, lineTotal: 25.98, modifiers: [], notes: null, stationId: 'grill' },
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    discountAmount: 0,
    total: 28.06,
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

describe('OrderDetailView', () => {
  it('shows loading state', () => {
    render(
      <OrderDetailView
        order={undefined}
        isLoading={true}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
        onPay={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Loading order...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <OrderDetailView
        order={undefined}
        isLoading={false}
        isError={true}
        error={new Error('Not found')}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
        onPay={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed to load order')).toBeInTheDocument();
  });

  it('renders order details', () => {
    const order = createOrder('order-1');
    render(
      <OrderDetailView
        order={order}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
        onPay={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/order-1/)).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('$28.06')).toBeInTheDocument();
  });

  it('shows submit button for draft orders', () => {
    const order = createOrder('order-1', { status: 'draft' });
    render(
      <OrderDetailView
        order={order}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onSubmit={vi.fn()}
        onPay={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Submit to Kitchen')).toBeInTheDocument();
  });
});
