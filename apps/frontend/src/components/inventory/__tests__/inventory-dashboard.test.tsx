import { render, screen } from '@testing-library/react';
import { InventoryDashboardContent } from '../dashboard/inventory-dashboard-content';
import type { InventoryDashboardData } from '@/lib/inventory-types';

const mockData: InventoryDashboardData = {
  totalProducts: 25,
  totalCategories: 5,
  totalSuppliers: 8,
  totalStockValue: 12500.50,
  lowStockCount: 3,
  outOfStockCount: 1,
  pendingOrderCount: 4,
  lowStockProducts: [
    { id: '1', name: 'Tomato Sauce', currentStock: 3, unit: 'L', category: 'RawMaterial' },
    { id: '2', name: 'Olive Oil', currentStock: 5, unit: 'L', category: 'RawMaterial' },
  ],
  outOfStockProducts: [{ id: '3', name: 'Basil', unit: 'Kg' }],
  pendingOrders: [
    { id: 'po1', supplierName: 'Sysco', totalAmount: 450, status: 'Approved', itemCount: 5, orderedAt: '2026-07-10T00:00:00Z', expectedDeliveryAt: '2026-07-20T00:00:00Z' },
  ],
  recentMovements: [
    { id: 'm1', ingredientName: 'Tomato Sauce', type: 'Consumption', quantity: -2, unit: 'L', createdAt: '2026-07-18T10:00:00Z' },
  ],
  topConsumed: [{ name: 'Tomato Sauce', quantity: 45 }],
  stockSummary: [],
};

const defaultProps = {
  onRefresh: vi.fn(),
  onRetry: vi.fn(),
};

describe('InventoryDashboardContent', () => {
  it('renders loading state', () => {
    const { container } = render(
      <InventoryDashboardContent isLoading isError={false} data={undefined} error={null} {...defaultProps} />,
    );
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError error={new Error('API Error')} data={undefined} {...defaultProps} />,
    );
    expect(screen.getByText(/failed to load inventory data/i)).toBeInTheDocument();
  });

  it('renders stat cards with data', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError={false} data={mockData} error={null} {...defaultProps} />,
    );
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('$12,500.50')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders low stock products section', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError={false} data={mockData} error={null} {...defaultProps} />,
    );
    expect(screen.getAllByText('Tomato Sauce').length).toBeGreaterThan(0);
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
  });

  it('renders pending orders section', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError={false} data={mockData} error={null} {...defaultProps} />,
    );
    expect(screen.getByText('Sysco')).toBeInTheDocument();
  });

  it('renders recent movements', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError={false} data={mockData} error={null} {...defaultProps} />,
    );
    expect(screen.getAllByText('Tomato Sauce').length).toBeGreaterThan(0);
  });

  it('renders top consumed products', () => {
    render(
      <InventoryDashboardContent isLoading={false} isError={false} data={mockData} error={null} {...defaultProps} />,
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
  });
});
