import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StationSelector, StationWorkload } from '../station-selector';
import type { KitchenStationInfo } from '@/lib/order-types';

const stations: KitchenStationInfo[] = [
  { id: 's1', kitchenId: 'k1', name: 'Grill', type: 'grill', status: 'active', displayOrder: 1, maxConcurrentTickets: 5, currentTickets: 2, assignedStaff: [], isAvailable: true },
  { id: 's2', kitchenId: 'k1', name: 'Dessert', type: 'dessert', status: 'active', displayOrder: 2, maxConcurrentTickets: 3, currentTickets: 3, assignedStaff: [], isAvailable: true },
  { id: 's3', kitchenId: 'k1', name: 'Cold', type: 'cold', status: 'inactive', displayOrder: 3, maxConcurrentTickets: 4, currentTickets: 0, assignedStaff: [], isAvailable: false },
];

describe('StationSelector', () => {
  it('renders all stations plus All Stations button', () => {
    render(
      <StationSelector
        stations={stations}
        selectedStationId={null}
        onSelectStation={vi.fn()}
      />,
    );
    expect(screen.getByText('All Stations')).toBeInTheDocument();
    expect(screen.getByText('Grill')).toBeInTheDocument();
    expect(screen.getByText('Dessert')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
  });

  it('calls onSelectStation with station id on click', async () => {
    const user = userEvent.setup();
    const onSelectStation = vi.fn();
    render(
      <StationSelector
        stations={stations}
        selectedStationId={null}
        onSelectStation={onSelectStation}
      />,
    );

    await user.click(screen.getByText('Grill'));
    expect(onSelectStation).toHaveBeenCalledWith('s1');
  });

  it('calls onSelectStation with null for All Stations', async () => {
    const user = userEvent.setup();
    const onSelectStation = vi.fn();
    render(
      <StationSelector
        stations={stations}
        selectedStationId={null}
        onSelectStation={onSelectStation}
      />,
    );

    await user.click(screen.getByText('All Stations'));
    expect(onSelectStation).toHaveBeenCalledWith(null);
  });

  it('marks selected station with aria-selected', () => {
    render(
      <StationSelector
        stations={stations}
        selectedStationId="s2"
        onSelectStation={vi.fn()}
      />,
    );
    expect(screen.getByText('Dessert').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Grill').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false');
  });

  it('shows ticket count when provided', () => {
    render(
      <StationSelector
        stations={stations}
        selectedStationId={null}
        onSelectStation={vi.fn()}
        ticketCounts={{ s1: 3, s2: 5, s3: 0 }}
      />,
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('shows high workload indicator', () => {
    render(
      <StationSelector
        stations={[{ ...stations[1]!, maxConcurrentTickets: 3, currentTickets: 3 }]}
        selectedStationId={null}
        onSelectStation={vi.fn()}
        ticketCounts={{ s2: 3 }}
      />,
    );
    // Dessert has 3/3 = 100% workload
    const btn = screen.getByLabelText(/Dessert station.*3 orders/);
    const pulses = btn.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(1);
  });
});

describe('StationWorkload', () => {
  it('renders station name and ticket count', () => {
    render(<StationWorkload station={stations[0]!} />);
    expect(screen.getByText('Grill')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('renders progress bar with correct value', () => {
    const { container } = render(<StationWorkload station={stations[0]!} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });

  it('caps workload at 100%', () => {
    const busyStation: KitchenStationInfo = {
      ...stations[0]!, maxConcurrentTickets: 2, currentTickets: 10,
    };
    const { container } = render(<StationWorkload station={busyStation} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });
});
