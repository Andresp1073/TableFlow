import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableStatusBadge, TableStatusBadgeSmall } from '../table-status-badge';
import type { TableStatus } from '@/lib/table-types';

const statuses: TableStatus[] = [
  'available', 'occupied', 'reserved', 'cleaning',
  'out_of_service', 'blocked', 'maintenance', 'archived',
];

describe('TableStatusBadge', () => {
  it.each(statuses)('renders %s status', (status) => {
    render(<TableStatusBadge status={status} />);
    const expectedLabel = status === 'out_of_service' ? 'Out of Service' :
      status.charAt(0).toUpperCase() + status.slice(1);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});

describe('TableStatusBadgeSmall', () => {
  it.each(statuses)('renders %s status with accessibility label', (status) => {
    render(<TableStatusBadgeSmall status={status} />);
    const expectedLabel = status === 'out_of_service' ? 'Out of Service' :
      status.charAt(0).toUpperCase() + status.slice(1);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(`Status: ${expectedLabel}`)).toBeInTheDocument();
  });
});
