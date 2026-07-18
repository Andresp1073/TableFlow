import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsView } from '../alerts/alerts-view';
import type { InventoryAlertsData } from '@/lib/inventory-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

const mockAlerts: InventoryAlertsData = {
  lowStock: [{ id: '1', name: 'Olive Oil', currentStock: 3, unit: 'L', category: 'RawMaterial' }],
  outOfStock: [{ id: '2', name: 'Basil', unit: 'Kg' }],
  expired: [{ id: 'e1', ingredientId: '3', ingredientName: 'Milk', quantity: 2, unit: 'L', batchCode: 'B001', expiresAt: '2026-07-01T00:00:00Z' }],
  expiringSoon: [{ id: 'es1', ingredientId: '4', ingredientName: 'Yogurt', quantity: 6, unit: 'Units', expiresAt: '2026-07-25T00:00:00Z', daysUntilExpiry: 7 }],
  pendingReceiving: [{ id: 'po1', supplierName: 'Sysco', status: 'Approved', itemCount: 5, totalAmount: 450, expectedDeliveryAt: '2026-07-20T00:00:00Z' }],
  totalLowStock: 1,
  totalOutOfStock: 1,
  totalExpired: 1,
  totalExpiringSoon: 1,
  totalPendingReceiving: 1,
};

describe('AlertsView', () => {
  it('renders loading state', () => {
    const { container } = render(<AlertsView isLoading isError={false} onRefresh={vi.fn()} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders all alert cards', () => {
    render(<AlertsView data={mockAlerts} isLoading={false} isError={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Expiring Soon (7 days)')).toBeInTheDocument();
    expect(screen.getByText('Pending Receiving')).toBeInTheDocument();
    expect(screen.getByText('Expired Products (1)')).toBeInTheDocument();
  });

  it('shows count badges', () => {
    render(<AlertsView data={mockAlerts} isLoading={false} isError={false} onRefresh={vi.fn()} />);
    const badges = screen.getAllByText('1');
    expect(badges.length).toBeGreaterThanOrEqual(4);
  });

  it('shows out of stock item', () => {
    render(<AlertsView data={mockAlerts} isLoading={false} isError={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('Basil')).toBeInTheDocument();
  });
});
