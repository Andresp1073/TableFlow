import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestaurantForm } from '../restaurant-form';
import type { Restaurant } from '@/lib/restaurant-types';

const mockRestaurant: Restaurant = {
  id: '1',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  legalName: 'Test LLC',
  taxId: '12-3456789',
  email: 'test@example.com',
  phone: '+1 555-123-4567',
  website: 'https://example.com',
  address: '123 Main St',
  logoUrl: null,
  timezone: 'America/New_York',
  currency: 'USD',
  language: 'en',
  status: 'active',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

describe('RestaurantForm', () => {
  it('renders create mode with empty fields', () => {
    render(<RestaurantForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('My Restaurant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('my-restaurant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create restaurant/i })).toBeInTheDocument();
  });

  it('renders edit mode with pre-filled data', () => {
    render(<RestaurantForm mode="edit" initialData={mockRestaurant} onSubmit={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText('My Restaurant') as HTMLInputElement;
    expect(nameInput.value).toBe('Test Restaurant');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<RestaurantForm mode="create" onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /create restaurant/i }));
    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RestaurantForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('My Restaurant'), 'New Place');
    await user.type(screen.getByPlaceholderText('my-restaurant'), 'new-place');
    await user.click(screen.getByRole('button', { name: /create restaurant/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Place', slug: 'new-place' }),
      expect.anything(),
    );
  });

  it('displays error alert', () => {
    render(<RestaurantForm mode="create" error="Something went wrong" onSubmit={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables inputs while loading', () => {
    render(<RestaurantForm mode="create" isLoading onSubmit={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});
