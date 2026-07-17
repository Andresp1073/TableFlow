import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TableActions } from '../table-actions';
import type { RestaurantTable } from '@/lib/table-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'rest-1' }),
}));

const mockTable: RestaurantTable = {
  id: 'table-1',
  restaurantId: 'rest-1',
  branchId: 'branch-1',
  diningAreaId: 'area-1',
  tableTypeId: null,
  tableNumber: 'T01',
  name: 'Window Table',
  description: null,
  minimumCapacity: 2,
  maximumCapacity: 4,
  currentCapacity: 0,
  shape: 'rectangle',
  width: 60,
  height: 60,
  positionX: 100,
  positionY: 200,
  rotation: 0,
  qrIdentifier: null,
  isReservable: true,
  isAccessible: true,
  isActive: true,
  status: 'available',
  metadata: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
  deletedAt: null,
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TableActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit button and actions dropdown', () => {
    renderWithQueryClient(<TableActions table={mockTable} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more actions/i })).toBeInTheDocument();
  });

  it('shows change status button for active table', () => {
    renderWithQueryClient(<TableActions table={mockTable} />);
    expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument();
  });

  it('shows archive option in dropdown', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TableActions table={mockTable} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/archive/i)).toBeInTheDocument();
  });

  it('opens confirmation dialog when archive clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TableActions table={mockTable} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    await user.click(screen.getByText(/archive/i));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('opens status change dialog', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TableActions table={mockTable} />);
    await user.click(screen.getByRole('button', { name: /change status/i }));
    expect(screen.getByText(/Change the status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new status/i)).toBeInTheDocument();
  });

  it('shows view on floor plan button when enabled', () => {
    renderWithQueryClient(
      <TableActions table={mockTable} showViewOnFloorPlan onViewOnFloorPlan={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /view on floor plan/i })).toBeInTheDocument();
  });

  it('shows disabled restore option for archived table', async () => {
    const user = userEvent.setup();
    const archivedTable: RestaurantTable = { ...mockTable, status: 'archived', isActive: false };
    renderWithQueryClient(<TableActions table={archivedTable} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/restore/i)).toBeInTheDocument();
  });

  it('calls onViewOnFloorPlan when clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    renderWithQueryClient(
      <TableActions table={mockTable} showViewOnFloorPlan onViewOnFloorPlan={onView} />,
    );
    await user.click(screen.getByRole('button', { name: /view on floor plan/i }));
    expect(onView).toHaveBeenCalled();
  });
});
