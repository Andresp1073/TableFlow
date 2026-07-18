import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchaseOrderList } from '../purchase-orders/purchase-order-list';
import type { PurchaseOrder } from '@/lib/inventory-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

const mockOrders: PurchaseOrder[] = [
  { id: 'po_001', supplierId: 's1', supplierName: 'Sysco', status: 'Draft', totalAmount: 450, itemCount: 5, receivedCount: 0, isFullyReceived: false, notes: '', orderedAt: null, expectedDeliveryAt: '2026-07-20T00:00:00Z', receivedAt: null, createdBy: 'user1', approvedBy: null, createdAt: '2026-07-10T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z' },
  { id: 'po_002', supplierId: 's2', supplierName: 'US Foods', status: 'Received', totalAmount: 1200, itemCount: 8, receivedCount: 8, isFullyReceived: true, notes: '', orderedAt: '2026-07-05T00:00:00Z', expectedDeliveryAt: '2026-07-15T00:00:00Z', receivedAt: '2026-07-14T00:00:00Z', createdBy: 'user1', approvedBy: 'manager1', createdAt: '2026-07-05T00:00:00Z', updatedAt: '2026-07-14T00:00:00Z' },
];

describe('PurchaseOrderList', () => {
  it('renders loading state', () => {
    const { container } = render(<PurchaseOrderList data={[]} loading error={null} onSubmit={vi.fn()} onApprove={vi.fn()} onCancel={vi.fn()} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders purchase order rows', () => {
    render(<PurchaseOrderList data={mockOrders} loading={false} error={null} onSubmit={vi.fn()} onApprove={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Sysco')).toBeInTheDocument();
    expect(screen.getByText('US Foods')).toBeInTheDocument();
  });

  it('shows status badges', () => {
    render(<PurchaseOrderList data={mockOrders} loading={false} error={null} onSubmit={vi.fn()} onApprove={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Received').length).toBeGreaterThan(0);
  });

  it('shows received count', () => {
    render(<PurchaseOrderList data={mockOrders} loading={false} error={null} onSubmit={vi.fn()} onApprove={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('0/5')).toBeInTheDocument();
    expect(screen.getByText('8/8')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<PurchaseOrderList data={[]} loading={false} error={null} onSubmit={vi.fn()} onApprove={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/no purchase orders found/i)).toBeInTheDocument();
  });
});
