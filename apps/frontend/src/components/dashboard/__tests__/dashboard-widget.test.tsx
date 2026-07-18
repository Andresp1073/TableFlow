import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardWidget } from '../dashboard-widget';

describe('DashboardWidget', () => {
  it('renders title and children', () => {
    render(
      <DashboardWidget title="Test Widget">
        <p>Widget content</p>
      </DashboardWidget>,
    );
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
    expect(screen.getByText('Widget content')).toBeInTheDocument();
  });

  it('shows loading state with skeleton', () => {
    const { container } = render(
      <DashboardWidget title="Loading Widget" isLoading>
        <p>Content</p>
      </DashboardWidget>,
    );
    expect(screen.getByText('Loading Widget')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error state with retry button', async () => {
    const user = userEvent.setup();
    const retryFn = vi.fn();
    render(
      <DashboardWidget title="Error Widget" isError error={new Error('Something went wrong')} onRetry={retryFn}>
        <p>Content</p>
      </DashboardWidget>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);
    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it('shows empty state', () => {
    render(
      <DashboardWidget title="Empty Widget" isEmpty emptyMessage="Nothing here">
        <p>Content</p>
      </DashboardWidget>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', async () => {
    const user = userEvent.setup();
    const refreshFn = vi.fn();
    render(
      <DashboardWidget title="Refreshable" onRefresh={refreshFn}>
        <p>Content</p>
      </DashboardWidget>,
    );
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshBtn);
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('renders action element', () => {
    render(
      <DashboardWidget title="With Action" action={<button>Action</button>}>
        <p>Content</p>
      </DashboardWidget>,
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });
});
