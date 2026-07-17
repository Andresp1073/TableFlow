import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloorPlanCanvas } from '../floor-plan-canvas';
import type { RestaurantTable } from '@/lib/table-types';

const mockTables: RestaurantTable[] = [
  {
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
  },
  {
    id: 'table-2',
    restaurantId: 'rest-1',
    branchId: 'branch-1',
    diningAreaId: 'area-1',
    tableTypeId: null,
    tableNumber: 'T02',
    name: null,
    description: null,
    minimumCapacity: 4,
    maximumCapacity: 6,
    currentCapacity: 0,
    shape: 'round',
    width: 50,
    height: 50,
    positionX: 300,
    positionY: 200,
    rotation: 0,
    qrIdentifier: null,
    isReservable: true,
    isAccessible: true,
    isActive: true,
    status: 'occupied',
    metadata: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
    deletedAt: null,
  },
];

describe('FloorPlanCanvas', () => {
  const defaultProps = {
    tables: mockTables,
    selectedTableId: null,
    onSelectTable: vi.fn(),
    onMoveTable: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toolbar with zoom controls', () => {
    render(<FloorPlanCanvas {...defaultProps} />);
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit to screen')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
  });

  it('renders toolbar with mode toggles', () => {
    render(<FloorPlanCanvas {...defaultProps} />);
    expect(screen.getByLabelText('Select mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide grid')).toBeInTheDocument();
  });

  it('renders zoom percentage', () => {
    render(<FloorPlanCanvas {...defaultProps} />);
    expect(screen.getByLabelText('Zoom 100%')).toBeInTheDocument();
  });

  it('renders table count', () => {
    render(<FloorPlanCanvas {...defaultProps} />);
    expect(screen.getByText('2 tables')).toBeInTheDocument();
  });

  it('renders all table cards', () => {
    render(<FloorPlanCanvas {...defaultProps} />);
    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.getByText('T02')).toBeInTheDocument();
  });

  it('shows empty state when no tables', () => {
    render(<FloorPlanCanvas {...defaultProps} tables={[]} />);
    expect(screen.getByText(/No tables in this area/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<FloorPlanCanvas {...defaultProps} isLoading />);
    expect(screen.getByText(/Loading floor plan/)).toBeInTheDocument();
  });

  it('selects table on click', async () => {
    const user = userEvent.setup();
    const onSelectTable = vi.fn();
    render(<FloorPlanCanvas {...defaultProps} onSelectTable={onSelectTable} />);
    const tableCard = screen.getByLabelText(/Table T01/);
    await user.click(tableCard);
    expect(onSelectTable).toHaveBeenCalledWith('table-1');
  });

  it('deselects table on second click', async () => {
    const user = userEvent.setup();
    const onSelectTable = vi.fn();
    render(<FloorPlanCanvas {...defaultProps} selectedTableId="table-1" onSelectTable={onSelectTable} />);
    const tableCard = screen.getByLabelText(/Table T01/);
    await user.click(tableCard);
    expect(onSelectTable).toHaveBeenCalledWith(null);
  });

  it('toggles grid visibility', async () => {
    const user = userEvent.setup();
    render(<FloorPlanCanvas {...defaultProps} />);
    const gridButton = screen.getByLabelText('Hide grid');
    expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    await user.click(gridButton);
    expect(gridButton).toHaveAttribute('aria-pressed', 'false');
    expect(gridButton).toHaveAttribute('aria-label', 'Show grid');
  });

  it('shows selected table info in footer', () => {
    render(<FloorPlanCanvas {...defaultProps} selectedTableId="table-1" />);
    expect(screen.getByText(/Table T01 selected/)).toBeInTheDocument();
  });

  it('renders dining area name when provided', () => {
    render(<FloorPlanCanvas {...defaultProps} diningAreaName="Main Hall" />);
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
  });

  it('renders with non-active tables as read-only', () => {
    const tablesWithInactive: RestaurantTable[] = [
      ...mockTables,
      {
        ...mockTables[0]!,
        id: 'table-3',
        tableNumber: 'T03',
        isActive: false,
        status: 'archived',
      },
    ];
    render(<FloorPlanCanvas {...defaultProps} tables={tablesWithInactive} />);
    expect(screen.getByText('T03')).toBeInTheDocument();
  });
});
