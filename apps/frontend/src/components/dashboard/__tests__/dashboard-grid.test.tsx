import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardGrid, DashboardGridItem } from '../dashboard-grid';

describe('DashboardGrid', () => {
  it('renders children', () => {
    render(
      <DashboardGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </DashboardGrid>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders grid layout class', () => {
    const { container } = render(
      <DashboardGrid>
        <div>Item</div>
      </DashboardGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid');
  });
});

describe('DashboardGridItem', () => {
  it('renders children', () => {
    render(
      <DashboardGridItem>
        <p>Grid item content</p>
      </DashboardGridItem>,
    );
    expect(screen.getByText('Grid item content')).toBeInTheDocument();
  });
});
