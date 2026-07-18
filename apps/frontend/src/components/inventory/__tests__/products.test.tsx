import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductList } from '../products/product-list';
import type { Product } from '@/lib/inventory-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockProducts: Product[] = [
  { id: '1', name: 'Tomato Sauce', category: 'RawMaterial', unit: 'L', costPerUnit: 3.50, currentStock: 15, isActive: true, sku: 'TS-001', preferredSupplierId: null, perishable: false, shelfLifeDays: null, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Olive Oil', category: 'RawMaterial', unit: 'L', costPerUnit: 8.00, currentStock: 5, isActive: true, sku: 'OO-001', preferredSupplierId: null, perishable: false, shelfLifeDays: null, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Pasta', category: 'RawMaterial', unit: 'Kg', costPerUnit: 2.00, currentStock: 0, isActive: false, sku: 'P-001', preferredSupplierId: null, perishable: false, shelfLifeDays: null, createdAt: '', updatedAt: '' },
];

describe('ProductList', () => {
  it('renders loading state', () => {
    const { container } = render(<ProductList data={[]} loading error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<ProductList data={[]} loading={false} error="Failed to load" onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ProductList data={[]} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it('renders product rows', () => {
    render(<ProductList data={mockProducts} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows archived status for inactive products', () => {
    render(<ProductList data={mockProducts} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getAllByText('Archived').length).toBeGreaterThan(0);
  });

  it('shows active status for active products', () => {
    render(<ProductList data={mockProducts} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });
});
