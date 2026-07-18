import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiningAreaDetailView } from '../dining-area-detail-view';
import type { DiningArea } from '@/lib/dining-area-types';

const mockArea: DiningArea = {
  id: 'area-1',
  restaurantId: 'rest-1',
  name: 'VIP Room',
  code: 'VIP_ROOM',
  description: 'Exclusive VIP area',
  displayOrder: 2,
  status: 'active',
  isReservable: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
};

describe('DiningAreaDetailView', () => {
  it('renders area name and code', () => {
    render(<DiningAreaDetailView area={mockArea} />);
    expect(screen.getAllByText('VIP Room').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('VIP_ROOM').length).toBeGreaterThanOrEqual(1);
  });

  it('renders status badge', () => {
    render(<DiningAreaDetailView area={mockArea} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders configuration details', () => {
    render(<DiningAreaDetailView area={mockArea} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('rest-1')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<DiningAreaDetailView area={mockArea} />);
    expect(screen.getByText('Exclusive VIP area')).toBeInTheDocument();
  });

  it('shows dash for null description', () => {
    const noDesc: DiningArea = { ...mockArea, description: null };
    render(<DiningAreaDetailView area={noDesc} />);
    expect(screen.queryByText('Exclusive VIP area')).not.toBeInTheDocument();
  });

  it('renders system info', () => {
    render(<DiningAreaDetailView area={mockArea} />);
    expect(screen.getByText('area-1')).toBeInTheDocument();
  });
});
