import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RestaurantStatusBadge } from '../restaurant-status-badge';

describe('RestaurantStatusBadge', () => {
  it('renders active status', () => {
    render(<RestaurantStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders suspended status', () => {
    render(<RestaurantStatusBadge status="suspended" />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('renders archived status', () => {
    render(<RestaurantStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('renders draft status', () => {
    render(<RestaurantStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<RestaurantStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders inactive status', () => {
    render(<RestaurantStatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
