import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonTable } from '../skeleton';

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.querySelector('div');
    expect(el).toBeInTheDocument();
    expect(el?.className).toContain('animate-shimmer');
  });

  it('renders skeleton card', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBe(3);
  });

  it('renders skeleton table with correct rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={4} />);
    const rows = container.querySelectorAll('div > div:not(:first-child)');
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});
