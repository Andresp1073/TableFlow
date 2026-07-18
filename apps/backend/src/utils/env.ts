export function isDevelopment(): boolean {
  return process.env['NODE_ENV'] === 'development';
}

export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

export function isTest(): boolean {
  return process.env['NODE_ENV'] === 'test';
}

export function isDebugEnabled(): boolean {
  return process.env['LOG_LEVEL'] === 'debug';
}
