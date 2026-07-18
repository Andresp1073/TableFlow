import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReservationSearch } from '../reservation-search';

describe('ReservationSearch', () => {
  it('renders search input', () => {
    render(<ReservationSearch onSearch={vi.fn()} />);
    expect(screen.getByLabelText(/search reservations/i)).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<ReservationSearch onSearch={vi.fn()} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ReservationSearch onSearch={onSearch} />);

    const input = screen.getByLabelText(/search reservations/i);
    await user.type(input, 'RES-001');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('RES-001');
  });

  it('shows clear button when query is entered', async () => {
    const user = userEvent.setup();
    render(<ReservationSearch onSearch={vi.fn()} />);

    const input = screen.getByLabelText(/search reservations/i);
    await user.type(input, 'RES-001');

    expect(screen.getByLabelText(/clear search/i)).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ReservationSearch onSearch={onSearch} />);

    const input = screen.getByLabelText(/search reservations/i);
    await user.type(input, 'RES-001');
    await user.click(screen.getByLabelText(/clear search/i));

    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('calls onSearch with empty string when input is cleared', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ReservationSearch onSearch={onSearch} />);

    const input = screen.getByLabelText(/search reservations/i);
    await user.type(input, 'RES-001');
    await user.clear(input);

    expect(onSearch).toHaveBeenCalledWith('');
  });
});
