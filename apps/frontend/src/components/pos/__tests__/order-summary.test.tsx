import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderSummary } from '../order-summary';
import type { OrderItem } from '@/lib/sales-types';

function createItem(id: string, overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id,
    orderId: 'order-1',
    menuItemId: id,
    menuItemName: 'Burger',
    quantity: 1,
    unitPrice: 12.99,
    lineTotal: 12.99,
    modifiers: [],
    notes: null,
    stationId: 'grill',
    ...overrides,
  };
}

describe('OrderSummary', () => {
  it('shows empty state', () => {
    render(
      <OrderSummary
        items={[]}
        onRemoveItem={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByText('No items added yet')).toBeInTheDocument();
  });

  it('renders items with totals', () => {
    const items = [
      createItem('item-1', { menuItemName: 'Burger', unitPrice: 12.99, lineTotal: 12.99 }),
      createItem('item-2', { menuItemName: 'Fries', unitPrice: 4.99, lineTotal: 4.99 }),
    ];
    render(
      <OrderSummary
        items={items}
        onRemoveItem={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Fries')).toBeInTheDocument();
    expect(screen.getByText('$17.98')).toBeInTheDocument();
  });

  it('calls onRemoveItem when remove button clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const items = [createItem('item-1')];

    render(
      <OrderSummary
        items={items}
        onRemoveItem={onRemove}
        onClear={vi.fn()}
      />,
    );

    const removeBtn = screen.getByLabelText('Remove Burger');
    await user.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('item-1');
  });

  it('calls onClear when clear button clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const items = [createItem('item-1')];

    render(
      <OrderSummary
        items={items}
        onRemoveItem={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalled();
  });
});
