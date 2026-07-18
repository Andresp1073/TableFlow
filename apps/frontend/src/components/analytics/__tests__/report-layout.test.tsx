import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportLayout } from '../report-layout';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe('ReportLayout', () => {
  it('renders title and description', () => {
    render(
      <ReportLayout title="Sales Report" description="Revenue analysis">
        <div>Content</div>
      </ReportLayout>,
    );
    expect(screen.getByText('Sales Report')).toBeInTheDocument();
    expect(screen.getByText('Revenue analysis')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ReportLayout title="Test" description="Desc">
        <div data-testid="child">Content</div>
      </ReportLayout>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ReportLayout title="Test" description="Desc" loading>
        <div>Content</div>
      </ReportLayout>,
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    const onRetry = vi.fn();
    render(
      <ReportLayout
        title="Test"
        description="Desc"
        error={new Error('API Error')}
        onRetry={onRetry}
      >
        <div>Content</div>
      </ReportLayout>,
    );
    expect(screen.getByText(/failed to load report/i)).toBeInTheDocument();
    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
