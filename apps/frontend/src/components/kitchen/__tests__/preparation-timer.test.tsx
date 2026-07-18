import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PreparationTimer } from '../preparation-timer';

describe('PreparationTimer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays formatted elapsed time', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const createdAt = new Date(now - 125_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        status="preparing"
        priority="normal"
      />,
    );

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('shows delayed indicator when past SLA limit', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const createdAt = new Date(now - 650_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        status="preparing"
        priority="normal"
      />,
    );

    // 650s > 600s (normal SLA limit)
    expect(screen.getByText('10:50')).toBeInTheDocument();
    expect(screen.getByLabelText(/delayed/)).toBeInTheDocument();
  });

  it('shows warning indicator when approaching SLA limit', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    // 85% of 600s = 510s
    const createdAt = new Date(now - 510_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        status="preparing"
        priority="normal"
      />,
    );

    expect(screen.getByLabelText(/approaching SLA limit/)).toBeInTheDocument();
  });

  it('updates timer every second while active', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const createdAt = new Date(now - 5_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        status="preparing"
        priority="normal"
      />,
    );

    expect(screen.getByText('0:05')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText('0:08')).toBeInTheDocument();
  });

  it('stops updating when delivered', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const createdAt = new Date(now - 10_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        status="delivered"
        priority="normal"
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays role="timer"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    render(
      <PreparationTimer
        createdAt={new Date(now - 30_000).toISOString()}
        status="preparing"
        priority="normal"
      />,
    );

    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('uses startedAt when provided', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    const createdAt = new Date(now - 120_000).toISOString();
    const startedAt = new Date(now - 60_000).toISOString();
    render(
      <PreparationTimer
        createdAt={createdAt}
        startedAt={startedAt}
        status="preparing"
        priority="normal"
      />,
    );

    // Should count from startedAt (60s ago), not createdAt (120s ago)
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });
});
