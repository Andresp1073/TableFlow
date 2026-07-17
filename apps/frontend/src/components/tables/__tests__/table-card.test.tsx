import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableCard } from '../table-card';
import type { RestaurantTable } from '@/lib/table-types';

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

describe('TableCard', () => {
  it('renders table number', () => {
    render(<TableCard table={mockTable} />);
    expect(screen.getByText('T01')).toBeInTheDocument();
  });

  it('renders capacity display', () => {
    render(<TableCard table={mockTable} />);
    expect(screen.getByText('2-4')).toBeInTheDocument();
  });

  it('renders table name when present', () => {
    render(<TableCard table={mockTable} />);
    expect(screen.getByText('Window Table')).toBeInTheDocument();
  });

  it('has correct ARIA label', () => {
    render(<TableCard table={mockTable} />);
    expect(screen.getByLabelText(/Table T01/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Available/)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacity 2-4/)).toBeInTheDocument();
  });

  it('applies selected state', () => {
    const { container } = render(<TableCard table={mockTable} isSelected />);
    const div = container.querySelector('[role="button"]');
    expect(div?.getAttribute('data-selected')).toBe('true');
  });

  it('renders round shape correctly', () => {
    const roundTable: RestaurantTable = { ...mockTable, shape: 'round', width: 50, height: 50 };
    const { container } = render(<TableCard table={roundTable} />);
    const svg = container.querySelector('svg');
    expect(svg?.innerHTML).toContain('circle');
  });

  it('renders oval shape correctly', () => {
    const ovalTable: RestaurantTable = { ...mockTable, shape: 'oval', width: 80, height: 50 };
    const { container } = render(<TableCard table={ovalTable} />);
    const svg = container.querySelector('svg');
    expect(svg?.innerHTML).toContain('ellipse');
  });

  it('renders square shape correctly', () => {
    const squareTable: RestaurantTable = { ...mockTable, shape: 'square', width: 60, height: 60 };
    const { container } = render(<TableCard table={squareTable} />);
    const svg = container.querySelector('svg');
    expect(svg?.innerHTML).toContain('rect');
  });

  it('does not show name when absent', () => {
    const noNameTable: RestaurantTable = { ...mockTable, name: null };
    render(<TableCard table={noNameTable} />);
    expect(screen.queryByText('Window Table')).not.toBeInTheDocument();
  });

  it('shows single capacity number when min equals max', () => {
    const sameCap: RestaurantTable = { ...mockTable, minimumCapacity: 4, maximumCapacity: 4 };
    render(<TableCard table={sameCap} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('handles keyboard selection', () => {
    const onSelect = vi.fn();
    render(<TableCard table={mockTable} onSelect={onSelect} />);
    const card = screen.getByRole('button');
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith('table-1');
  });
});
