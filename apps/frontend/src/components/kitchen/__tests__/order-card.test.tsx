import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderCard } from '../order-card';
import type { KitchenTicket } from '@/lib/order-types';

function createTicket(overrides: Partial<KitchenTicket> = {}): KitchenTicket {
  return {
    id: 'ticket-1',
    restaurantId: 'rest-1',
    kitchenId: 'kitchen-1',
    orderId: 'order-1',
    stationId: 'station-1',
    priority: 'normal',
    status: 'new',
    items: [
      { id: 'item-1', menuItemId: 'menu-1', menuItemName: 'Burger', quantity: 2, status: 'pending', stationId: 'station-1', modifiers: [], estimatedPrepTimeSeconds: 300 },
      { id: 'item-2', menuItemId: 'menu-2', menuItemName: 'Fries', quantity: 1, status: 'pending', stationId: 'station-1', modifiers: ['Large'], estimatedPrepTimeSeconds: 180 },
    ],
    notes: [],
    tableId: 'T01',
    customerName: 'John Doe',
    customerCount: 2,
    source: 'pos',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

describe('OrderCard', () => {
  it('renders order number and status', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText(/order-1/i)).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders customer and table info', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/T01/)).toBeInTheDocument();
  });

  it('renders all item rows', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Fries')).toBeInTheDocument();
  });

  it('shows action buttons based on status transitions', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    const actions = screen.getByRole('group', { name: 'Order actions' });
    expect(within(actions).getByRole('button', { name: 'Move to accepted' })).toBeInTheDocument();
    expect(within(actions).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows Cancel button for active states', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
  });

  it('calls onStatusChange when action is clicked', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(<OrderCard ticket={createTicket()} onStatusChange={onStatusChange} />);

    await user.click(screen.getByRole('button', { name: 'Move to accepted' }));
    expect(onStatusChange).toHaveBeenCalledWith('ticket-1', 'accepted');
  });

  it('renders priority badge for non-normal priority', () => {
    render(<OrderCard ticket={createTicket({ priority: 'urgent' })} onStatusChange={vi.fn()} />);
    expect(screen.getByText((content) => content.toUpperCase() === 'URGENT')).toBeInTheDocument();
  });

  it('does not show priority badge for normal', () => {
    render(<OrderCard ticket={createTicket({ priority: 'normal' })} onStatusChange={vi.fn()} />);
    expect(screen.queryByText('NORMAL')).not.toBeInTheDocument();
  });

  it('shows notes section when notes exist', () => {
    render(
      <OrderCard
        ticket={createTicket({ notes: ['No onions', 'Extra sauce'] })}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('No onions')).toBeInTheDocument();
    expect(screen.getByText('Extra sauce')).toBeInTheDocument();
  });

  it('applies cancelled styling', () => {
    render(
      <OrderCard ticket={createTicket({ status: 'cancelled' })} onStatusChange={vi.fn()} />,
    );
    const article = screen.getByRole('article');
    expect(article.className).toContain('opacity-60');
  });

  it('applies delivered styling', () => {
    render(
      <OrderCard ticket={createTicket({ status: 'delivered' })} onStatusChange={vi.fn()} />,
    );
    const article = screen.getByRole('article');
    expect(article.className).toContain('opacity-70');
  });

  it('renders with aria-label for order', () => {
    render(<OrderCard ticket={createTicket()} onStatusChange={vi.fn()} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label');
  });

  it('shows "more items" button when >3 items', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`, menuItemId: `menu-${i}`, menuItemName: `Item ${i}`,
      quantity: 1, status: 'pending' as const, stationId: 'station-1', modifiers: [],
    }));
    render(<OrderCard ticket={createTicket({ items })} onStatusChange={vi.fn()} />);
    expect(screen.getByText(/2 more items/)).toBeInTheDocument();
  });

  it('expands items on clicking more', async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`, menuItemId: `menu-${i}`, menuItemName: `Item ${i}`,
      quantity: 1, status: 'pending' as const, stationId: 'station-1', modifiers: [],
    }));
    render(<OrderCard ticket={createTicket({ items })} onStatusChange={vi.fn()} />);

    expect(screen.getAllByText(/Item/).length).toBe(3);
    await user.click(screen.getByText(/2 more items/));
    expect(screen.getAllByText(/Item/).length).toBe(5);
  });
});
