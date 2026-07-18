import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from '../quick-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('QuickActions', () => {
  it('renders all action buttons', () => {
    render(<QuickActions />);
    expect(screen.getByText('Create Reservation')).toBeInTheDocument();
    expect(screen.getByText('Open Table')).toBeInTheDocument();
    expect(screen.getByText('Manage Tables')).toBeInTheDocument();
    expect(screen.getByText('View Kitchen')).toBeInTheDocument();
    expect(screen.getByText('View Inventory')).toBeInTheDocument();
    expect(screen.getByText('Manage Customers')).toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<QuickActions />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders all action buttons with accessible labels', () => {
    render(<QuickActions />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });
});
