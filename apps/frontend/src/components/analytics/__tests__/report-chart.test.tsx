import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportChart } from '../report-chart';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

describe('ReportChart', () => {
  it('renders title', () => {
    render(
      <ReportChart
        title="Revenue Chart"
        type="bar"
        data={[{ label: 'Jan', value: 100 }]}
      />,
    );
    expect(screen.getByText('Revenue Chart')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <ReportChart
        title="Test"
        description="Monthly revenue data"
        type="bar"
        data={[{ label: 'Jan', value: 100 }]}
      />,
    );
    expect(screen.getByText('Monthly revenue data')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <ReportChart
        title="Empty Chart"
        type="bar"
        data={[]}
      />,
    );
    expect(screen.getByText('No data available for this period.')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <ReportChart
        title="Loading Chart"
        type="bar"
        data={[]}
        loading
      />,
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders bar chart with data', () => {
    const { container } = render(
      <ReportChart
        title="Bar Chart"
        type="bar"
        data={[
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ]}
      />,
    );
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
  });

  it('renders pie chart', () => {
    render(
      <ReportChart
        title="Pie Chart"
        type="pie"
        data={[
          { name: 'X', value: 30, color: '#ff0000' },
          { name: 'Y', value: 70, color: '#00ff00' },
        ]}
      />,
    );
    expect(screen.getByText('Pie Chart')).toBeInTheDocument();
  });
});
