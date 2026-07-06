export const appConfig = {
  api: {
    baseUrl: '/api/v1',
    timeout: 15_000,
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  dateFormat: {
    date: 'MMM dd, yyyy',
    time: 'h:mm a',
    dateTime: 'MMM dd, yyyy h:mm a',
  },
} as const;
