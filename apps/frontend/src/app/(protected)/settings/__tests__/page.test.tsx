import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import * as settingsService from '@/services/settings';
import type { RestaurantSettings, BusinessHours } from '@/lib/settings-types';
import SettingsPage from '../page';

const mockSettings: RestaurantSettings = {
  id: 'sett-1', restaurantId: 'rest-1',
  timezone: 'America/New_York', currency: 'USD', language: 'en',
  dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', weekStartsOn: 0,
  taxPercentage: 8.5, serviceChargePercentage: 5,
  defaultReservationDuration: 60, reservationBufferMinutes: 15,
  allowWalkIns: true, autoConfirmReservations: false,
  maxReservationsPerCustomer: 10, reservationCancellationHours: 24,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

const mockBusinessHours: BusinessHours = {
  id: 'bh-1', restaurantId: 'rest-1',
  schedules: [
    { dayOfWeek: 1, isClosed: false, periods: [{ openTime: '09:00', closeTime: '17:00', order: 0 }] },
    { dayOfWeek: 2, isClosed: false, periods: [{ openTime: '09:00', closeTime: '17:00', order: 0 }] },
    { dayOfWeek: 3, isClosed: false, periods: [{ openTime: '09:00', closeTime: '17:00', order: 0 }] },
    { dayOfWeek: 4, isClosed: false, periods: [{ openTime: '09:00', closeTime: '17:00', order: 0 }] },
    { dayOfWeek: 5, isClosed: false, periods: [{ openTime: '09:00', closeTime: '17:00', order: 0 }] },
    { dayOfWeek: 6, isClosed: true, periods: [] },
    { dayOfWeek: 7, isClosed: true, periods: [] },
  ],
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/settings',
}));

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
  }, [setCurrent]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper(withRestaurant = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        React.createElement(ThemeProvider, null,
          withRestaurant
            ? React.createElement(RestaurantSetup, null, children)
            : children,
        ),
      ),
    );
  };
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(settingsService, 'getBusinessHours').mockResolvedValue(mockBusinessHours);
    vi.spyOn(settingsService, 'updateSettings').mockResolvedValue(mockSettings);
    vi.spyOn(settingsService, 'updateBusinessHours').mockResolvedValue(mockBusinessHours);
  });

  it('renders the default dashboard section', async () => {
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    const dashboards = screen.getAllByText('Dashboard');
    expect(dashboards.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Overview of your restaurant settings and configuration.')).toBeInTheDocument();
  });

  it('renders the sidebar navigation', () => {
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument();
    expect(within(nav).getByText('Restaurant Info')).toBeInTheDocument();
    expect(within(nav).getByText('Business Hours')).toBeInTheDocument();
    expect(within(nav).getByText('Regional')).toBeInTheDocument();
    expect(within(nav).getByText('Tax')).toBeInTheDocument();
    expect(within(nav).getByText('Notifications')).toBeInTheDocument();
    expect(within(nav).getByText('Appearance')).toBeInTheDocument();
    expect(within(nav).getByText('Security')).toBeInTheDocument();
    expect(within(nav).getByText('About')).toBeInTheDocument();
  });

  it('navigates to regional section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Regional'));
    await waitFor(() => {
      const items = screen.getAllByText('Regional Settings');
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Configure timezone, currency, and regional preferences.')).toBeInTheDocument();
    });
  });

  it('navigates to business hours section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Business Hours'));
    await waitFor(() => {
      expect(screen.getByText('Set opening and closing hours for each day of the week.')).toBeInTheDocument();
    });
  });

  it('navigates to tax section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Tax'));
    await waitFor(() => {
      const items = screen.getAllByText('Tax Settings');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates to restaurant section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Restaurant Info'));
    await waitFor(() => {
      expect(screen.getByText('Restaurant Information')).toBeInTheDocument();
    });
  });

  it('navigates to notifications section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Notifications'));
    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });

  it('navigates to appearance section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Appearance'));
    await waitFor(() => {
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });
  });

  it('navigates to security section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('Security'));
    await waitFor(() => {
      const passwords = screen.getAllByText('Password');
      expect(passwords.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates to about section when clicked', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await user.click(screen.getByText('About'));
    await waitFor(() => {
      expect(screen.getByText('Application Information')).toBeInTheDocument();
    });
  });

  it('renders dashboard with settings overview', async () => {
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Settings Overview')).toBeInTheDocument();
      expect(screen.getByText('America/New_York')).toBeInTheDocument();
    });
  });

  it('shows select a restaurant message when no restaurant selected', () => {
    render(React.createElement(SettingsPage), { wrapper: createWrapper(false) });
    expect(screen.getByText('Select a restaurant to view settings.')).toBeInTheDocument();
  });

  it('highlights the active section in sidebar', async () => {
    const user = userEvent.setup();
    render(React.createElement(SettingsPage), { wrapper: createWrapper() });
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    const dashboardBtn = within(nav).getByText('Dashboard').closest('button');
    expect(dashboardBtn).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByText('Tax'));
    await waitFor(() => {
      const taxBtn = within(nav).getByText('Tax').closest('button');
      expect(taxBtn).toHaveAttribute('aria-current', 'page');
    });
  });
});
