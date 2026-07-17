import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableDetailView } from '../table-detail-view';
import type { RestaurantTable } from '@/lib/table-types';

const mockTable: RestaurantTable = {
  id: 'table-1',
  restaurantId: 'rest-1',
  branchId: 'branch-1',
  diningAreaId: 'area-1',
  tableTypeId: null,
  tableNumber: 'T01',
  name: 'Window Table',
  description: 'Near the window',
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

describe('TableDetailView', () => {
  it('renders table number and name', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.getAllByText(/Window Table/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders status indicator', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(1);
  });

  it('renders capacity information', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('2 – 4')).toBeInTheDocument();
  });

  it('renders position coordinates', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText(/(100, 200)/)).toBeInTheDocument();
  });

  it('renders dimensions', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('60 × 60')).toBeInTheDocument();
  });

  it('renders reservable and accessible info', () => {
    render(<TableDetailView table={mockTable} />);
    const yesLabels = screen.getAllByText('Yes');
    expect(yesLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('renders description when present', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('Near the window')).toBeInTheDocument();
  });

  it('shows dash for null description', () => {
    const noDesc: RestaurantTable = { ...mockTable, description: null };
    render(<TableDetailView table={noDesc} />);
    expect(screen.queryByText('Near the window')).not.toBeInTheDocument();
  });

  it('renders audit information', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('table-1')).toBeInTheDocument();
    expect(screen.getByText('rest-1')).toBeInTheDocument();
  });

  it('renders shape label', () => {
    render(<TableDetailView table={mockTable} />);
    expect(screen.getByText('Rectangle')).toBeInTheDocument();
  });

  it('shows "Not positioned" when position is null', () => {
    const noPos: RestaurantTable = { ...mockTable, positionX: null, positionY: null };
    render(<TableDetailView table={noPos} />);
    expect(screen.getByText('Not positioned')).toBeInTheDocument();
  });

  it('shows single capacity when min equals max', () => {
    const singleCap: RestaurantTable = { ...mockTable, minimumCapacity: 4, maximumCapacity: 4 };
    render(<TableDetailView table={singleCap} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
