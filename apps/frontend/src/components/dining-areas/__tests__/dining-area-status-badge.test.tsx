import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiningAreaStatusBadge } from '../dining-area-status-badge';

describe('DiningAreaStatusBadge', () => {
  it('renders active status', () => {
    render(<DiningAreaStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders archived status', () => {
    render(<DiningAreaStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
