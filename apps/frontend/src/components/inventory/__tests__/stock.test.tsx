import { render, screen } from '@testing-library/react';
import { StockTable } from '../stock/stock-table';
import type { StockSummary } from '@/lib/inventory-types';

const mockStock: StockSummary[] = [
  { id: '1', name: 'Tomato Sauce', category: 'RawMaterial', unit: 'L', currentStock: 15, reservedStock: 2, availableStock: 13, minimumStock: 10, maximumStock: 100, costPerUnit: 3.50, totalValue: 52.50, batchCount: 2, isLowStock: false, isOverstock: false },
  { id: '2', name: 'Olive Oil', category: 'RawMaterial', unit: 'L', currentStock: 5, reservedStock: 1, availableStock: 4, minimumStock: 10, maximumStock: 50, costPerUnit: 8.00, totalValue: 40.00, batchCount: 1, isLowStock: true, isOverstock: false },
  { id: '3', name: 'Pasta', category: 'RawMaterial', unit: 'Kg', currentStock: 120, reservedStock: 0, availableStock: 120, minimumStock: 20, maximumStock: 100, costPerUnit: 2.00, totalValue: 240.00, batchCount: 3, isLowStock: false, isOverstock: true },
];

describe('StockTable', () => {
  it('renders loading state', () => {
    const { container } = render(<StockTable data={[]} loading error={null} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders stock rows', () => {
    render(<StockTable data={mockStock} loading={false} error={null} />);
    expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows low stock badge', () => {
    render(<StockTable data={mockStock} loading={false} error={null} />);
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('shows overstock badge', () => {
    render(<StockTable data={mockStock} loading={false} error={null} />);
    expect(screen.getByText('Overstock')).toBeInTheDocument();
  });

  it('shows OK badge for normal stock', () => {
    render(<StockTable data={mockStock} loading={false} error={null} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<StockTable data={[]} loading={false} error={null} />);
    expect(screen.getByText(/no stock data available/i)).toBeInTheDocument();
  });
});
