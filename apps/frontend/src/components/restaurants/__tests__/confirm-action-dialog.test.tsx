import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActionDialog } from '../confirm-action-dialog';

describe('ConfirmActionDialog', () => {
  it('renders when open', () => {
    render(
      <ConfirmActionDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm Action"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmActionDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Confirm Action"
        description="Are you sure?"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmActionDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm"
        description="Proceed?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons while loading', () => {
    render(
      <ConfirmActionDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm"
        description="Loading..."
        confirmLabel="Save"
        loading={true}
        onConfirm={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const dialogButtons = buttons.filter((b) => b.getAttribute('type') !== 'button' || b.textContent?.includes('Cancel'));
    dialogButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
