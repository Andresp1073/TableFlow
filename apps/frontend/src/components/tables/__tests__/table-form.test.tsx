import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableForm } from '../table-form';
import type { RestaurantTable } from '@/lib/table-types';

const mockTable: RestaurantTable = {
  id: 'table-1',
  restaurantId: 'rest-1',
  branchId: 'branch-1',
  diningAreaId: 'area-1',
  tableTypeId: null,
  tableNumber: 'T01',
  name: 'Window Table',
  description: 'Near the window',
  minimumCapacity: 2,
  maximumCapacity: 4,
  currentCapacity: 0,
  shape: 'rectangle',
  width: 60,
  height: 60,
  positionX: 100,
  positionY: 200,
  rotation: 0,
  qrIdentifier: null,
  isReservable: true,
  isAccessible: true,
  isActive: true,
  status: 'available',
  metadata: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
  deletedAt: null,
};

describe('TableForm', () => {
  it('renders create mode with default values', () => {
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('T01')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Window Table 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create table/i })).toBeInTheDocument();
  });

  it('renders edit mode with pre-filled data', () => {
    render(<TableForm mode="edit" initialData={mockTable} onSubmit={vi.fn()} />);
    const tableNumberInput = screen.getByPlaceholderText('T01') as HTMLInputElement;
    expect(tableNumberInput.value).toBe('T01');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    const tableNumberInput = screen.getByPlaceholderText('T01');
    await user.clear(tableNumberInput);
    await user.click(screen.getByRole('button', { name: /create table/i }));
    expect(screen.getByText(/table number is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TableForm mode="create" branchId="branch-1" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('T01'), 'T05');
    await user.type(screen.getByPlaceholderText('Window Table 1'), 'Corner Table');
    await user.click(screen.getByRole('button', { name: /create table/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ tableNumber: 'T05', name: 'Corner Table' }),
      expect.anything(),
    );
  });

  it('displays error alert', () => {
    render(<TableForm mode="create" error="Table number already exists" onSubmit={vi.fn()} />);
    expect(screen.getByText('Table number already exists')).toBeInTheDocument();
  });

  it('disables inputs while loading', () => {
    render(<TableForm mode="create" isLoading onSubmit={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('renders shape select', () => {
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Table shape')).toBeInTheDocument();
  });

  it('renders capacity fields', () => {
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('4')).toBeInTheDocument();
  });

  it('renders checkbox options', () => {
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/reservable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wheelchair accessible/i)).toBeInTheDocument();
  });

  it('renders active checkbox in edit mode', () => {
    render(<TableForm mode="edit" initialData={mockTable} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
  });

  it('does not render active checkbox in create mode', () => {
    render(<TableForm mode="create" onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/active/i)).not.toBeInTheDocument();
  });
});
