export interface RestaurantSettings {
  id: string;
  restaurantId: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  taxPercentage: number;
  serviceChargePercentage: number;
  defaultReservationDuration: number;
  reservationBufferMinutes: number;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  maxReservationsPerCustomer: number;
  reservationCancellationHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningPeriodDTO {
  openTime: string;
  closeTime: string;
  order: number;
}

export interface DayScheduleDTO {
  dayOfWeek: number;
  isClosed: boolean;
  periods: OpeningPeriodDTO[];
}

export interface BusinessHours {
  id: string;
  restaurantId: string;
  schedules: DayScheduleDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  taxPercentage?: number;
  serviceChargePercentage?: number;
  defaultReservationDuration?: number;
  reservationBufferMinutes?: number;
  allowWalkIns?: boolean;
  autoConfirmReservations?: boolean;
  maxReservationsPerCustomer?: number;
  reservationCancellationHours?: number;
}

export interface UpdateBusinessHoursInput {
  schedules: {
    dayOfWeek: number;
    isClosed: boolean;
    periods: { openTime: string; closeTime: string; order: number }[];
  }[];
}

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Boise', label: 'Mountain Time - Boise' },
  { value: 'America/Indiana/Indianapolis', label: 'Eastern Time - Indiana' },
  { value: 'America/Detroit', label: 'Eastern Time - Detroit' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
  { value: 'America/Sao_Paulo', label: 'Brasilia' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'America/Vancouver', label: 'Vancouver' },
] as const;

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'MXN', label: 'Mexican Peso (Mex$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'BRL', label: 'Brazilian Real (R$)' },
  { value: 'ARS', label: 'Argentine Peso (ARS$)' },
  { value: 'CLP', label: 'Chilean Peso (CLP$)' },
  { value: 'COP', label: 'Colombian Peso (COL$)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'NZD', label: 'New Zealand Dollar (NZ$)' },
  { value: 'SEK', label: 'Swedish Krona (kr)' },
  { value: 'NOK', label: 'Norwegian Krone (kr)' },
  { value: 'DKK', label: 'Danish Krone (kr)' },
  { value: 'SGD', label: 'Singapore Dollar (S$)' },
  { value: 'HKD', label: 'Hong Kong Dollar (HK$)' },
  { value: 'KRW', label: 'South Korean Won (₩)' },
  { value: 'ZAR', label: 'South African Rand (R)' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'it', label: 'Italian (Italiano)' },
  { value: 'pt', label: 'Portuguese (Português)' },
  { value: 'ja', label: 'Japanese (日本語)' },
  { value: 'ko', label: 'Korean (한국어)' },
  { value: 'zh', label: 'Chinese (中文)' },
  { value: 'ar', label: 'Arabic (العربية)' },
  { value: 'ru', label: 'Russian (Русский)' },
  { value: 'nl', label: 'Dutch (Nederlands)' },
  { value: 'sv', label: 'Swedish (Svenska)' },
  { value: 'da', label: 'Danish (Dansk)' },
  { value: 'no', label: 'Norwegian (Norsk)' },
  { value: 'pl', label: 'Polish (Polski)' },
] as const;

export const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-01-31)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/01/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/31/2024)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.01.2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-01-2024)' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/01/31)' },
] as const;

export const TIME_FORMAT_OPTIONS = [
  { value: 'HH:mm', label: '24-hour (14:30)' },
  { value: 'hh:mm A', label: '12-hour (02:30 PM)' },
  { value: 'hh:mm a', label: '12-hour lowercase (02:30 pm)' },
  { value: 'HH:mm:ss', label: '24-hour with seconds (14:30:00)' },
  { value: 'hh:mm:ss A', label: '12-hour with seconds (02:30:00 PM)' },
] as const;

export const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$',
    MXN: 'Mex$', AUD: 'A$', BRL: 'R$', ARS: 'ARS$', CLP: 'CLP$',
    COP: 'COL$', CHF: 'CHF', CNY: '¥', INR: '₹', NZD: 'NZ$',
    SEK: 'kr', NOK: 'kr', DKK: 'kr', SGD: 'S$', HKD: 'HK$',
    KRW: '₩', ZAR: 'R',
  };
  return map[code] ?? code;
}

export function formatCurrencyWithSymbol(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
}
