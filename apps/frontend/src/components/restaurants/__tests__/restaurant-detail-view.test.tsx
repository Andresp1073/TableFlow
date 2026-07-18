import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RestaurantDetailView } from '../restaurant-detail-view';
import type { Restaurant } from '@/lib/restaurant-types';

const mockRestaurant: Restaurant = {
  id: 'abc-123',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  legalName: 'Test LLC',
  taxId: '12-3456789',
  email: 'test@example.com',
  phone: '+1 555-123-4567',
  website: 'https://example.com',
  address: '123 Main St, City, ST 12345',
  logoUrl: null,
  timezone: 'America/New_York',
  currency: 'USD',
  language: 'en',
  status: 'active',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
  deletedAt: null,
};

describe('RestaurantDetailView', () => {
  it('renders restaurant name and slug', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('test-restaurant')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders business information', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('Test LLC')).toBeInTheDocument();
    expect(screen.getByText('12-3456789')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 555-123-4567')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, City, ST 12345')).toBeInTheDocument();
  });

  it('renders regional settings', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('America/New_York')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('renders system info', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.getByText('abc-123')).toBeInTheDocument();
  });

  it('shows dash for null values', () => {
    const partialRestaurant: Restaurant = {
      ...mockRestaurant,
      legalName: null,
      taxId: null,
      website: null,
    };
    render(<RestaurantDetailView restaurant={partialRestaurant} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('does not show Archived label when not archived', () => {
    render(<RestaurantDetailView restaurant={mockRestaurant} />);
    expect(screen.queryByText(/archived/i)).not.toBeInTheDocument();
  });

  it('shows archived date when deletedAt is present', () => {
    const archived: Restaurant = {
      ...mockRestaurant,
      deletedAt: '2024-12-01T00:00:00Z',
    };
    render(<RestaurantDetailView restaurant={archived} />);
    expect(screen.getByText(/archived/i)).toBeInTheDocument();
    expect(screen.getByText(/30\/11\/2024/)).toBeInTheDocument();
  });
});
