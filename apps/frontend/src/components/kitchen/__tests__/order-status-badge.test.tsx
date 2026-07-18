import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge, OrderStatusDot } from '../order-status-badge';
import type { TicketStatus } from '@/lib/order-types';

describe('OrderStatusBadge', () => {
  const statuses: TicketStatus[] = ['new', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];

  for (const status of statuses) {
    it(`renders ${status} status`, () => {
      render(<OrderStatusBadge status={status} />);
      const labels: Record<TicketStatus, string> = {
        new: 'New', accepted: 'Accepted', preparing: 'Preparing',
        ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
      };
      expect(screen.getByText(labels[status])).toBeInTheDocument();
    });
  }

  it('renders with aria-label', () => {
    render(<OrderStatusBadge status="new" />);
    expect(screen.getByLabelText('Order status: New')).toBeInTheDocument();
  });

  it('applies size class for lg', () => {
    const { container } = render(<OrderStatusBadge status="ready" size="lg" />);
    expect(container.firstChild).toHaveClass('text-sm');
  });
});

describe('OrderStatusDot', () => {
  it('renders status label', () => {
    render(<OrderStatusDot status="preparing" />);
    expect(screen.getByText('Preparing')).toBeInTheDocument();
  });

  it('renders with aria-hidden indicator', () => {
    const { container } = render(<OrderStatusDot status="cancelled" />);
    const dot = container.querySelector('span > span');
    expect(dot).toHaveClass('bg-destructive');
  });
});
