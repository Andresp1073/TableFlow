import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import * as settingsService from '@/services/settings';
import type { RestaurantSettings, BusinessHours } from '@/lib/settings-types';
import { SettingsRegional } from '@/components/settings/settings-regional';
import { SettingsTax } from '@/components/settings/settings-tax';
import { SettingsBusiness } from '@/components/settings/settings-business';
import { SettingsBusinessHours } from '@/components/settings/settings-business-hours';
import { SettingsDashboard } from '@/components/settings/settings-dashboard';
import { SettingsRestaurant } from '@/components/settings/settings-restaurant';
import { SettingsNotifications } from '@/components/settings/settings-notifications';
import { SettingsAppearance } from '@/components/settings/settings-appearance';
import { SettingsSecurity } from '@/components/settings/settings-security';
import { SettingsAbout } from '@/components/settings/settings-about';

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

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
  }, [setCurrent]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        React.createElement(ThemeProvider, null,
          React.createElement(RestaurantSetup, null, children),
        ),
      ),
    );
  };
}

describe('Settings Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(settingsService, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(settingsService, 'getBusinessHours').mockResolvedValue(mockBusinessHours);
    vi.spyOn(settingsService, 'updateSettings').mockResolvedValue(mockSettings);
    vi.spyOn(settingsService, 'updateBusinessHours').mockResolvedValue(mockBusinessHours);
  });

  describe('SettingsRegional', () => {
    it('renders regional form with current values', async () => {
      render(React.createElement(SettingsRegional), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByText(/Regional Settings/i)).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });
  });

  describe('SettingsTax', () => {
    it('renders tax form with current values', async () => {
      render(React.createElement(SettingsTax), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByText('Tax Settings')).toBeInTheDocument();
        expect(screen.getByLabelText('Tax Rate (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Service Charge (%)')).toBeInTheDocument();
      });
    });
  });

  describe('SettingsBusiness', () => {
    it('renders business settings form', async () => {
      render(React.createElement(SettingsBusiness), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByText('Business Settings')).toBeInTheDocument();
        expect(screen.getByLabelText('Allow Walk-ins')).toBeInTheDocument();
        expect(screen.getByLabelText('Auto-confirm Reservations')).toBeInTheDocument();
      });
    });
  });

  describe('SettingsBusinessHours', () => {
    it('renders business hours editor', async () => {
      render(React.createElement(SettingsBusinessHours), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Tuesday')).toBeInTheDocument();
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
      });
    });

    it('shows closed days', async () => {
      render(React.createElement(SettingsBusinessHours), { wrapper: createWrapper() });
      await waitFor(() => {
        const closed = screen.getAllByText('Closed');
        expect(closed.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('SettingsDashboard', () => {
    it('renders settings overview with data', async () => {
      render(React.createElement(SettingsDashboard), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByText('Settings Overview')).toBeInTheDocument();
        expect(screen.getByText('America/New_York')).toBeInTheDocument();
        expect(screen.getByText('USD')).toBeInTheDocument();
      });
    });
  });

  describe('SettingsRestaurant', () => {
    it('renders restaurant information', () => {
      render(React.createElement(SettingsRestaurant), { wrapper: createWrapper() });
      expect(screen.getByText('Restaurant Information')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });
  });

  describe('SettingsNotifications', () => {
    it('renders notification toggles', () => {
      render(React.createElement(SettingsNotifications), { wrapper: createWrapper() });
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Reservation Notifications')).toBeInTheDocument();
      expect(screen.getByText('Kitchen Notifications')).toBeInTheDocument();
      expect(screen.getByText('Inventory Alerts')).toBeInTheDocument();
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
    });
  });

  describe('SettingsAppearance', () => {
    it('renders theme options', () => {
      render(React.createElement(SettingsAppearance), { wrapper: createWrapper() });
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  describe('SettingsSecurity', () => {
    it('renders security sections', () => {
      render(React.createElement(SettingsSecurity), { wrapper: createWrapper() });
      const twoFA = screen.getAllByText('Two-Factor Authentication');
      expect(twoFA.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });
  });

  describe('SettingsAbout', () => {
    it('renders app information', () => {
      render(React.createElement(SettingsAbout), { wrapper: createWrapper() });
      expect(screen.getByText('TableFlow')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('MIT')).toBeInTheDocument();
    });
  });
});
