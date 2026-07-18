import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderBoard } from '../order-board';
import type { KitchenTicket } from '@/lib/order-types';

function createTicket(id: string, status: KitchenTicket['status'], overrides: Partial<KitchenTicket> = {}): KitchenTicket {
  return {
    id,
    restaurantId: 'rest-1',
    kitchenId: 'kitchen-1',
    orderId: `order-${id}`,
    stationId: 'station-1',
    priority: 'normal',
    status,
    items: [{ id: `${id}-item-1`, menuItemId: 'menu-1', menuItemName: 'Pizza', quantity: 1, status: 'pending', stationId: 'station-1', modifiers: [] }],
    notes: [],
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

describe('OrderBoard', () => {
  it('renders all status columns when tickets exist', () => {
    const tickets = [
      createTicket('t1', 'new'),
      createTicket('t2', 'preparing'),
    ];
    render(<OrderBoard tickets={tickets} onStatusChange={vi.fn()} />);
    // Column headings should be rendered
    expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: 'Accepted' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ready' })).toBeInTheDocument();
  });

  it('shows empty state when no tickets', () => {
    render(<OrderBoard tickets={[]} onStatusChange={vi.fn()} />);
    expect(screen.getByText('No active orders')).toBeInTheDocument();
  });

  it('groups tickets by status', () => {
    const tickets = [
      createTicket('t1', 'new'),
      createTicket('t2', 'preparing'),
      createTicket('t3', 'preparing'),
      createTicket('t4', 'ready'),
    ];
    render(<OrderBoard tickets={tickets} onStatusChange={vi.fn()} />);

    expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Preparing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ready').length).toBeGreaterThanOrEqual(1);
  });

  it('shows ticket count badges', () => {
    const tickets = [
      createTicket('t1', 'new'),
      createTicket('t2', 'new'),
      createTicket('t3', 'new'),
    ];
    render(<OrderBoard tickets={tickets} onStatusChange={vi.fn()} />);

    const newColumn = screen.getByLabelText('3 orders');
    expect(newColumn).toBeInTheDocument();
  });

  it('renders region with accessible label when tickets exist', () => {
    const tickets = [createTicket('t1', 'new')];
    render(<OrderBoard tickets={tickets} onStatusChange={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Order board' })).toBeInTheDocument();
  });

  it('passes onStatusChange to order cards', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const ticket = createTicket('t1', 'new');
    render(<OrderBoard tickets={[ticket]} onStatusChange={onStatusChange} />);

    await user.click(screen.getByRole('button', { name: 'Move to accepted' }));
    expect(onStatusChange).toHaveBeenCalledWith('t1', 'accepted');
  });
});
