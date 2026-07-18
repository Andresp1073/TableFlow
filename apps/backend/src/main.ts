import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { APP } from './config/constants.js';
import {
  requestId,
  requestLogger,
  rateLimiter,
  notFoundHandler,
  errorHandler,
} from './middlewares/index.js';
import { healthRouter, authRouter, restaurantRouter, auditRouter, dashboardRouter, inventoryRouter, customersRouter, loyaltyRouter, ordersRouter, checkoutRouter, paymentsRouter, adminRouter } from './routes/index.js';
import { eventBus } from './events/index.js';
import { initializePaymentStore } from './modules/payments/infrastructure/repositories/store.js';
const app = express();

app.set('trust proxy', 1);

app.use(requestId);
app.use(requestLogger);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimiter({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX,
  }),
);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: APP.NAME,
      version: APP.VERSION,
      environment: env.NODE_ENV,
    },
  });
});

app.use(`${APP.API_PREFIX}/health`, healthRouter);
app.use(`${APP.API_PREFIX}/auth`, authRouter);
app.use(`${APP.API_PREFIX}/restaurants`, restaurantRouter);
app.use(`${APP.API_PREFIX}/audit`, auditRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/dashboard`, dashboardRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/inventory`, inventoryRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/customers`, customersRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/loyalty`, loyaltyRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/orders`, ordersRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/checkout`, checkoutRouter);
app.use(`${APP.API_PREFIX}/restaurants/:id/payments`, paymentsRouter);

app.use(`${APP.API_PREFIX}/admin`, adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

function registerEventHandlers(): void {
  eventBus.on('*', (payload) => {
    logger.debug({ payload }, 'Event emitted');
  });
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    await initializePaymentStore();
    registerEventHandlers();

    app.listen(env.PORT, env.HOST, () => {
      logger.info(`${APP.NAME} v${APP.VERSION} running on http://${env.HOST}:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

start();

export default app;
