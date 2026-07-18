import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KdsHeader } from '../kds-header';
import type { KitchenStats } from '@/lib/order-types';

describe('KdsHeader', () => {
  it('renders title', () => {
    render(<KdsHeader title="Test Kitchen" />);
    expect(screen.getByText('Test Kitchen')).toBeInTheDocument();
  });

  it('renders default title when not provided', () => {
    render(<KdsHeader />);
    expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
  });

  it('renders stats when provided', () => {
    const stats: KitchenStats = {
      totalOrders: 10, pending: 3, preparing: 4, ready: 2, completed: 1,
      averagePrepTime: 420, slaLate: 1,
    };
    render(<KdsHeader stats={stats} />);

    expect(screen.getByLabelText('New: 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Prep: 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Ready: 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Late: 1')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<KdsHeader><button>Test Child</button></KdsHeader>);
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('has banner role', () => {
    render(<KdsHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
