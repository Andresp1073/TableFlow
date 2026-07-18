import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiningAreaForm } from '../dining-area-form';
import type { DiningArea } from '@/lib/dining-area-types';

const mockArea: DiningArea = {
  id: '1',
  restaurantId: 'rest-1',
  name: 'Main Hall',
  code: 'MAIN_HALL',
  description: 'The main dining area',
  displayOrder: 1,
  status: 'active',
  isReservable: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('DiningAreaForm', () => {
  it('renders create mode with empty fields', () => {
    render(<DiningAreaForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Main Hall')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('MAIN_HALL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create dining area/i })).toBeInTheDocument();
  });

  it('renders edit mode with pre-filled data', () => {
    render(<DiningAreaForm mode="edit" initialData={mockArea} onSubmit={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText('Main Hall') as HTMLInputElement;
    expect(nameInput.value).toBe('Main Hall');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<DiningAreaForm mode="create" onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /create dining area/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/code is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DiningAreaForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Main Hall'), 'Terrace');
    await user.type(screen.getByPlaceholderText('MAIN_HALL'), 'TERRACE');
    await user.click(screen.getByRole('button', { name: /create dining area/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Terrace', code: 'TERRACE' }),
      expect.anything(),
    );
  });

  it('displays error alert', () => {
    render(<DiningAreaForm mode="create" error="Duplicate code" onSubmit={vi.fn()} />);
    expect(screen.getByText('Duplicate code')).toBeInTheDocument();
  });

  it('disables inputs while loading', () => {
    render(<DiningAreaForm mode="create" isLoading onSubmit={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});
