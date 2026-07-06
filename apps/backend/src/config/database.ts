import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

const SLOW_QUERY_THRESHOLD_MS = env.DB_SLOW_QUERY_THRESHOLD_MS;

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

  if (env.isDevelopment) {
    client.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
      const duration = e.duration;

      if (duration >= SLOW_QUERY_THRESHOLD_MS) {
        logger.warn(
          { query: e.query, params: e.params, duration: `${duration}ms` },
          'Slow query detected',
        );
      } else {
        logger.debug(
          { query: e.query, params: e.params, duration: `${duration}ms` },
          'Prisma query',
        );
      }
    });
  }

  client.$on('warn' as never, (e: { message: string }) => {
    logger.warn({ prisma: e.message }, 'Prisma warning');
  });

  client.$on('error' as never, (e: { message: string }) => {
    logger.error({ prisma: e.message }, 'Prisma error');
  });

  return client;
}

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }

  return prismaInstance;
}

export const prisma = getPrismaClient();

export async function connectDatabase(): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info(`Database connected (attempt ${attempt})`);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(
        { attempt, maxRetries, error: lastError.message },
        'Database connection attempt failed',
      );

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.info({ delayMs: delay }, 'Retrying database connection...');
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error({ error: lastError }, 'Failed to connect to database after all retries');
  process.exit(1);
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error(error, 'Error disconnecting database');
  }
}

export async function verifyDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
}> {
  const start = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return {
      connected: true,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
