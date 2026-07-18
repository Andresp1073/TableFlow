import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportFilters } from '../report-filters';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('ReportFilters', () => {
  it('renders period label', () => {
    render(<ReportFilters />);
    expect(screen.getByText('Period:')).toBeInTheDocument();
  });

  it('renders date range selector', () => {
    render(<ReportFilters />);
    expect(screen.getByRole('combobox', { name: /select date range/i })).toBeInTheDocument();
  });

  it('shows default date range text', () => {
    render(<ReportFilters />);
    const dateText = screen.getByText(/\d{4}-\d{2}-\d{2}/);
    expect(dateText).toBeInTheDocument();
  });

  it('calls onDateRangeChange when preset changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ReportFilters onDateRangeChange={onChange} />);

    const trigger = screen.getByRole('combobox', { name: /select date range/i });
    await user.click(trigger);

    const option = screen.getByRole('option', { name: /today/i });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ preset: 'today' }),
    );
  });
});
