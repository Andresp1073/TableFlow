import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyDatabaseConnection } from '../config/database.js';
import { env } from '../config/env.js';
import { APP } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

interface DbDiagnostics {
  status: 'connected' | 'disconnected';
  latencyMs: number;
  poolSize?: number;
}

interface HealthData {
  status: 'ok' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  database: DbDiagnostics;
}

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbResult = await verifyDatabaseConnection();

    const health: HealthData = {
      status: dbResult.connected ? 'ok' : 'degraded',
      version: APP.VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
      database: {
        status: dbResult.connected ? 'connected' : 'disconnected',
        latencyMs: dbResult.latencyMs,
      },
    };

    const statusCode = health.status === 'ok' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
    });
  }),
);

export default router;
